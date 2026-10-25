import type { CreateResponseDto, SubmittedField, UploadedAnswer } from './dto/create-response.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormEntity } from '../entities/form.entity';
import { FormResponseEntity, AttendanceStatus } from '../entities/form-response.entity';
import { AttendanceService } from '../attendance/attendance.service';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(FormResponseEntity)
    private readonly responses: Repository<FormResponseEntity>,
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
    private readonly attendanceService: AttendanceService,
  ) { }

  async submit(
    identifier: string,
    dto: CreateResponseDto,
  ) {
    const form = /^\d+$/.test(identifier)
      ? null
      : await this.forms.findOne({ 
          where: { shareToken: identifier },
          relations: ['settings', 'attendance'] 
        });
    if (!form)
      throw new NotFoundException('Form not found');
    const formId = form.id;
    const now = new Date();
    if (form.status === 'disabled') {
      throw new BadRequestException('Form is currently disabled');
    }
    if (form.status === 'disable_date' || form.status === 'disable_both') {
      if (form.settings?.expirationAt) {
        const expDate = new Date(form.settings?.expirationAt);
        if (now > expDate) {
          throw new BadRequestException('Form has reached its expiration date');
        }
      }
    }
    if (form.status === 'disable_limit' || form.status === 'disable_both') {
      if (form.settings?.submissionLimit) {
        const count = await this.responses.count({ where: { formId } });
        if (count >= form.settings?.submissionLimit) {
          throw new BadRequestException('Form has reached its submission limit');
        }
      }
    }
    if (form.settings?.submissionStartTime && now < new Date(form.settings?.submissionStartTime)) {
      throw new BadRequestException('Form is not open for submissions yet');
    }
    if (form.settings?.submissionEndTime && now > new Date(form.settings?.submissionEndTime)) {
      throw new BadRequestException('Form submission deadline has passed');
    }
    this.validateFormData(form, dto.formData);
    const formData: Record<string, { label: string; value: unknown }> = {};
    for (const [key, entry] of Object.entries(dto.formData)) {
      let value: unknown = entry.value;
      if ((entry.type === 'fileupload' || entry.type === 'image') && entry.value) {
        const uploadedFiles = Array.isArray(entry.value) ? entry.value : [entry.value as UploadedAnswer];
        const savedFiles = await Promise.all(uploadedFiles.map(file => this.saveUploadedFile(formId, file)));
        value = Array.isArray(entry.value) ? JSON.stringify(savedFiles.map(saved => JSON.parse(saved))) : savedFiles[0];
      }
      formData[key] = { label: entry.label, value };
    }
    const entity = this.responses.create({
      formId,
      formData: formData,
      status: 'pending',
      scanLogs: [],
      qrToken: null,
    });
    const saved = await this.responses.save(entity);
    if (form.attendance?.attendanceEnabled) {
      saved.qrToken = this.attendanceService.generateQRToken(
        saved.id,
        formId,
        form,
      );
      await this.responses.save(saved);
    }
    return {
      id: saved.id,
      formId: saved.formId,
      status: saved.status,
      qrToken: saved.qrToken,
      submittedAt: saved.submittedAt,
      createdAt: saved.createdAt,
    };
  }


  private validateFormData(form: FormEntity, formData: Record<string, SubmittedField>): void {
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      throw new BadRequestException('formData must be an object');
    }

    let pages = form.pages;
    if (typeof pages === 'string') {
      try {
        pages = JSON.parse(pages);
      } catch {
        throw new BadRequestException('The saved form structure is invalid');
      }
    }
    if (!Array.isArray(pages)) {
      throw new BadRequestException('The saved form structure is invalid');
    }

    const fields = new Map<string, { type: string; label?: string }>();
    for (const page of pages) {
      if (!Array.isArray(page?.elements)) continue;
      for (const field of page.elements) {
        if (field && field.type !== 'heading' && field.type !== 'logobanner') {
          fields.set('el_' + field.id, field);
        }
      }
    }

    for (const [key, entry] of Object.entries(formData)) {
      const field = fields.get(key);
      if (!field) throw new BadRequestException('Unknown form field: ' + key);
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new BadRequestException('Invalid answer for ' + key);
      }
      if (entry.type !== field.type || typeof entry.label !== 'string') {
        throw new BadRequestException('Invalid field type or label for ' + key);
      }
      // Use the server's label, rather than trusting a label sent by the browser.
      entry.label = field.label || field.type;

      if (field.type === 'fileupload' || field.type === 'image') {
        if (entry.value === '' || entry.value === null) continue;
        if (Array.isArray(entry.value)) {
          if (!entry.value.length) {
            throw new BadRequestException('An uploaded file list cannot be empty');
          }
          entry.value.forEach(file => this.validateUploadedFile(file));
        }
        else {
          this.validateUploadedFile(entry.value);
        }
      } else {
        const valueType = typeof entry.value;
        if (entry.value !== null && valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean') {
          throw new BadRequestException('Invalid answer value for ' + key);
        }
      }
    }
  }

  private validateUploadedFile(value: SubmittedField['value']): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('An uploaded file must contain its name and data');
    }
    if (typeof value.name !== 'string' || !value.name.trim() || typeof value.data !== 'string') {
      throw new BadRequestException('An uploaded file must contain its name and data');
    }
    const match = value.data.match(/^data:[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/);
    if (!match || match[1] === undefined) throw new BadRequestException('Invalid uploaded file data');
    const content = Buffer.from(match[1], 'base64');
    if (content.toString('base64') !== match[1]) {
      throw new BadRequestException('Invalid uploaded file data');
    }
  }

  private async saveUploadedFile(formId: number, file: UploadedAnswer): Promise<string> {
    const encoded = file.data.slice(file.data.indexOf(',') + 1);
    const content = Buffer.from(encoded, 'base64');
    const extension = path.extname(file.name).toLowerCase();
    const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '.bin';
    const filename = crypto.randomBytes(16).toString('hex') + safeExtension;
    const uploadDir = path.join(process.cwd(), 'uploads', String(formId), 'responses');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), content);
    // Existing response views expect this metadata as a JSON string.
    return JSON.stringify({
      fileUrl: '/uploads/' + formId + '/responses/' + filename,
      fileName: file.name,
    });
  }

  async listForOwner(ownerId: number, formId: number) {
    const form = await this.forms.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== ownerId) throw new ForbiddenException('Not allowed');

    return await this.responses.find({
      where: { formId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteResponse(ownerId: number, responseId: string) {
    const response = await this.responses.findOne({
      where: { id: responseId },
    });
    if (!response) throw new NotFoundException('Response not found');

    const form = await this.forms.findOne({
      where: { id: response.formId },
    });
    if (!form || form.ownerId !== ownerId)
      throw new ForbiddenException('Not allowed');

    await this.responses.remove(response);
    return { deleted: true };
  }

  async getResponse(responseId: string) {
    const response = await this.responses.findOne({
      where: { id: responseId },
      relations: ['form'],
    });
    if (!response) throw new NotFoundException('Response not found');

    const formattedData =
      this.attendanceService.formatResponseData(response);

    return {
      id: response.id,
      formId: response.formId,
      status: response.status,
      submittedAt: response.submittedAt,
      checkInTime: response.checkInTime,
      scanLogs: response.scanLogs,
      formData: formattedData,
      form: response.form
        ? { id: response.form.id, title: response.form.title }
        : null,
    };
  }

  async update(
    ownerId: number,
    responseId: string,
    dto: {
      status?: AttendanceStatus;
      formData?: Record<string, { label: string; value: any }>;
    },
  ) {
    const response = await this.responses.findOne({
      where: { id: responseId },
    });
    if (!response) throw new NotFoundException('Response not found');

    const form = await this.forms.findOne({
      where: { id: response.formId },
    });
    if (!form || form.ownerId !== ownerId)
      throw new ForbiddenException('Not allowed');

    if (dto.status) response.status = dto.status;
    if (dto.formData) response.formData = dto.formData;

    return await this.responses.save(response);
  }
}
