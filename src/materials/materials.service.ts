import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormMaterialEntity } from '../entities/form-material.entity';
import { FormEntity } from '../entities/form.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES_PER_FORM = 10;

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(FormMaterialEntity)
    private readonly materials: Repository<FormMaterialEntity>,
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
  ) {}

  private async verifyOwner(ownerId: number, formId: number): Promise<FormEntity> {
    const form = await this.forms.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== ownerId) throw new ForbiddenException('Not allowed');
    return form;
  }

  private async getPublicFormByIdentifier(identifier: string): Promise<FormEntity> {
    const form = /^\d+$/.test(identifier)
      ? null
      : await this.forms.findOne({ where: { shareToken: identifier } });

    if (!form || !form.isPublished) throw new NotFoundException('Form not found');
    return form;
  }

  async upload(
    ownerId: number,
    formId: number,
    files: Express.Multer.File[],
  ): Promise<FormMaterialEntity[]> {
    await this.verifyOwner(ownerId, formId);

    // Check existing file count
    const existingCount = await this.materials.count({ where: { formId } });
    if (existingCount + files.length > MAX_FILES_PER_FORM) {
      throw new BadRequestException(
        `Maximum ${MAX_FILES_PER_FORM} files allowed per form. Currently ${existingCount} files uploaded.`,
      );
    }

    const uploadDir = path.join(process.cwd(), 'uploads', String(formId), 'materials');
    await fs.mkdir(uploadDir, { recursive: true });

    const results: FormMaterialEntity[] = [];

    for (const file of files) {
      // Validate mime type
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds the 10MB limit.`,
        );
      }

      // Generate unique filename
      const ext = path.extname(file.originalname) || '';
      const storedFilename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
      const filePath = path.join(uploadDir, storedFilename);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Save metadata to database
      const entity = this.materials.create({
        formId,
        originalName: file.originalname,
        storedFilename,
        mimeType: file.mimetype,
        size: file.size,
      });
      const saved = await this.materials.save(entity);
      results.push(saved);
    }

    return results;
  }

  async listByForm(identifier: string): Promise<FormMaterialEntity[]> {
    const form = await this.getPublicFormByIdentifier(identifier);
    return await this.materials.find({
      where: { formId: form.id },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteOne(ownerId: number, formId: number, materialId: number): Promise<{ deleted: boolean }> {
    await this.verifyOwner(ownerId, formId);

    const material = await this.materials.findOne({
      where: { id: materialId, formId },
    });
    if (!material) throw new NotFoundException('Material not found');

    // Delete file from disk
    try {
      const filePath = path.join(
        process.cwd(),
        'uploads',
        String(formId),
        'materials',
        material.storedFilename,
      );
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore if file doesn't exist on disk
    }

    await this.materials.remove(material);
    return { deleted: true };
  }
}
