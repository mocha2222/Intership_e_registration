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
    formId: number,
    dto: {
      respondentEmail?: string;
      answers: Record<string, any>;
      formData?: Record<string, { label: string; value: any }>;
    },
  ) {
    const form = await this.forms.findOne({ where: { id: formId } });
    if (!form || !form.isPublished)
      throw new NotFoundException('Form not found');


    const now = new Date();
    if (form.status === 'disabled') {
      throw new BadRequestException('Form is currently disabled');
    }
    if (form.submissionStartTime && now < new Date(form.submissionStartTime)) {
      throw new BadRequestException('Form is not open for submissions yet');
    }
    if (form.submissionEndTime && now > new Date(form.submissionEndTime)) {
      throw new BadRequestException('Form submission deadline has passed');
    }

    const answers = dto.answers as Record<string, any>;
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    if (answers && typeof answers === 'object') {
      for (const [key, val] of Object.entries(answers)) {
        if (
          typeof val === 'string' &&
          val.startsWith('{') &&
          val.includes('"data":"data:')
        ) {
          try {
            const parsed = JSON.parse(val);
            if (parsed.name && parsed.data && parsed.data.startsWith('data:')) {
              const base64Parts = parsed.data.split('base64,');
              if (base64Parts.length === 2) {
                const ext = parsed.name.includes('.')
                  ? parsed.name.split('.').pop()
                  : 'bin';
                const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
                const buffer = Buffer.from(base64Parts[1], 'base64');
                await fs.writeFile(path.join(uploadDir, filename), buffer);
                answers[key] = JSON.stringify({
                  fileUrl: `/uploads/${filename}`,
                  fileName: parsed.name || filename,
                });
              }
            }
          } catch {
          }
        }
      }
    }

    const formData = dto.formData || null;

    const entity = this.responses.create({
      formId,
      formData: formData,
      status: 'pending',
      scanLogs: [],

      qrToken: crypto.randomBytes(32).toString('hex'),
    });

    const saved = await this.responses.save(entity);


    const qrToken = this.attendanceService.generateQRToken(
      saved.id,
      formId,
      form,
    );


    saved.qrToken = qrToken;
    await this.responses.save(saved);

    return {
      id: saved.id,
      formId: saved.formId,
      status: saved.status,
      qrToken: saved.qrToken,
      submittedAt: saved.submittedAt,
      createdAt: saved.createdAt,
    };
  }


  async listForOwner(ownerId: number, formId: number) {
    const form = await this.forms.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== ownerId) throw new ForbiddenException('Not allowed');

    return await this.responses.find({
      where: { formId },
      order: { createdAt: 'DESC' },
      take: 50,
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
