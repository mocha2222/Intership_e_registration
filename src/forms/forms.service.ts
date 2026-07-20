import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { FormEntity } from '../entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
  ) { }

  private generateShareToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  async create(ownerId: number, dto: CreateFormDto) {
    const entity = this.forms.create({
      shareToken: this.generateShareToken(),
      ownerId,
      title: dto.title,
      description: dto.description ?? null,
      schema: dto.schema ?? null,
      isPublished: dto.isPublished ?? false,
      status: dto.status ?? 'enabled',
      layoutType: dto.layoutType ?? 'classic',
      folderKey: dto.folderKey ?? 'all',
      label: dto.label ?? null,
      pages: dto.pages ?? [{ elements: [] }],
      nextElementId: dto.nextElementId ?? 1,
      logoUrl: dto.logoUrl ?? null,
      design: dto.design ?? {
        pageBgColor: '#f0f2f8',
        formBgColor: '#FFFFFF',
        fontColor: '#2C3345',
        inputBgColor: '#FFFFFF',
        pageBgImage: '',
        formBgImage: '',
      },
      accessMode: dto.accessMode ?? 'public',
      permissionMode: dto.permissionMode ?? 'submit_and_view',
    });
    return await this.forms.save(entity);
  }

  async listMine(
    ownerId: number,
    filter?: 'active' | 'favorites' | 'archived' | 'trash' | 'all',
  ) {
    const qb = this.forms
      .createQueryBuilder('f')
      .where('f.ownerId = :ownerId', { ownerId });

    switch (filter) {
      case 'favorites':
        qb.andWhere('f.isFavorite = :fav', { fav: true });
        qb.andWhere('f.trashedAt IS NULL');
        break;
      case 'archived':
        qb.andWhere('f.isArchived = :arc', { arc: true });
        qb.andWhere('f.trashedAt IS NULL');
        break;
      case 'trash':
        qb.andWhere('f.trashedAt IS NOT NULL');
        break;
      case 'all':
        break;
      case 'active':
      default:
        qb.andWhere('f.isArchived = :arc', { arc: false });
        qb.andWhere('f.trashedAt IS NULL');
        break;
    }

    qb.orderBy('f.updatedAt', 'DESC');
    return await qb.getMany();
  }

  async getMine(ownerId: number, id: number) {
    const form = await this.forms.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== ownerId) throw new ForbiddenException('Not allowed');
    return form;
  }

  async getPublic(shareToken: string) {
    const form = await this.forms.findOne({ where: { shareToken } });
    if (!form) throw new NotFoundException('Form not found');
    if (!form.isPublished) throw new NotFoundException('Form not found');
    return form;
  }

  async processBase64Image(base64Str: string, formId: number): Promise<string> {
    if (!base64Str || !base64Str.startsWith('data:image/')) return base64Str;
    const base64Parts = base64Str.split('base64,');
    if (base64Parts.length !== 2) return base64Str;

    const extMatch = base64Str.match(/^data:image\/([a-zA-Z0-9]+);/);
    const ext = extMatch ? extMatch[1] : 'png';
    const uploadDir = path.join(process.cwd(), 'uploads', String(formId), 'admin');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    const buffer = Buffer.from(base64Parts[1], 'base64');
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return `/uploads/${formId}/admin/${filename}`;
  }

  async deleteOldImage(url: string | null | undefined) {
    if (!url || !url.startsWith('/uploads/')) return;
    try {
      const filePath = path.join(process.cwd(), url);
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }

  async updateMine(ownerId: number, id: number, dto: UpdateFormDto) {
    const form = await this.getMine(ownerId, id);

    if (dto.title !== undefined) form.title = dto.title;
    if (dto.description !== undefined)
      form.description = dto.description as any;
    if (dto.schema !== undefined) form.schema = dto.schema;
    if (dto.isPublished !== undefined) form.isPublished = dto.isPublished;
    if (dto.status !== undefined) form.status = dto.status;
    if (dto.layoutType !== undefined) form.layoutType = dto.layoutType;
    if (dto.folderKey !== undefined) form.folderKey = dto.folderKey;
    if (dto.label !== undefined) form.label = dto.label ?? null;

    if (dto.pages !== undefined) {
      const oldImageUrls = new Set<string>();
      const oldPages = (form.pages as any[]) || [];
      for (const page of oldPages) {
        if (page.elements) {
          for (const el of page.elements) {
            if (el.type === 'image' && typeof el.settings?.url === 'string' && el.settings.url.startsWith('/uploads/')) {
              oldImageUrls.add(el.settings.url);
            }
          }
        }
      }

      const newImageUrls = new Set<string>();
      for (const page of dto.pages) {
        if (page.elements) {
          for (const el of page.elements) {
            if (el.type === 'image' && el.settings?.url && typeof el.settings.url === 'string') {
              if (el.settings.url.startsWith('data:image/')) {
                el.settings.url = await this.processBase64Image(el.settings.url, form.id);
              }
              newImageUrls.add(el.settings.url);
            }
          }
        }
      }

      for (const oldUrl of oldImageUrls) {
        if (!newImageUrls.has(oldUrl)) {
          await this.deleteOldImage(oldUrl);
        }
      }
      form.pages = dto.pages;
    }

    if (dto.nextElementId !== undefined) form.nextElementId = dto.nextElementId;
    
    if (dto.logoUrl !== undefined) {
      if (form.logoUrl && dto.logoUrl !== form.logoUrl) {
        await this.deleteOldImage(form.logoUrl);
      }
      form.logoUrl = dto.logoUrl ? await this.processBase64Image(dto.logoUrl, form.id) : null;
    }

    if (dto.design !== undefined) {
      const oldDesign = (form.design as Record<string, any>) || {};
      
      if (dto.design.pageBgImage !== undefined) {
        if (oldDesign.pageBgImage && dto.design.pageBgImage !== oldDesign.pageBgImage) {
          await this.deleteOldImage(oldDesign.pageBgImage);
        }
        if (dto.design.pageBgImage) {
          dto.design.pageBgImage = await this.processBase64Image(dto.design.pageBgImage, form.id);
        }
      }
      
      if (dto.design.formBgImage !== undefined) {
        if (oldDesign.formBgImage && dto.design.formBgImage !== oldDesign.formBgImage) {
          await this.deleteOldImage(oldDesign.formBgImage);
        }
        if (dto.design.formBgImage) {
          dto.design.formBgImage = await this.processBase64Image(dto.design.formBgImage, form.id);
        }
      }
      form.design = dto.design;
    }
    if (dto.isFavorite !== undefined) form.isFavorite = dto.isFavorite;
    if (dto.isArchived !== undefined) form.isArchived = dto.isArchived;
    if (dto.accessMode !== undefined) form.accessMode = dto.accessMode;
    if (dto.permissionMode !== undefined)
      form.permissionMode = dto.permissionMode;

    // ── Attendance ──
    if (dto.attendanceEnabled !== undefined)
      form.attendanceEnabled = dto.attendanceEnabled;

    // ── Submission Timing ──
    if (dto.submissionStartTime !== undefined)
      form.submissionStartTime = dto.submissionStartTime
        ? new Date(dto.submissionStartTime)
        : null;
    if (dto.submissionEndTime !== undefined)
      form.submissionEndTime = dto.submissionEndTime
        ? new Date(dto.submissionEndTime)
        : null;

    // ── Attendance Timing ──
    if (dto.eventStartTime !== undefined)
      form.eventStartTime = dto.eventStartTime
        ? new Date(dto.eventStartTime)
        : null;
    if (dto.eventEndTime !== undefined)
      form.eventEndTime = dto.eventEndTime
        ? new Date(dto.eventEndTime)
        : null;
    if (dto.attendanceCloseTime !== undefined)
      form.attendanceCloseTime = dto.attendanceCloseTime
        ? new Date(dto.attendanceCloseTime)
        : null;

    // ── Time Range Validation ──
    if (
      form.submissionStartTime &&
      form.submissionEndTime &&
      form.submissionEndTime < form.submissionStartTime
    ) {
      throw new BadRequestException('Submission end time must be after start time');
    }

    if (form.attendanceEnabled) {
      if (
        form.eventStartTime &&
        form.eventEndTime &&
        form.eventEndTime < form.eventStartTime
      ) {
        throw new BadRequestException('Event end time must be after start time');
      }
      if (
        form.eventEndTime &&
        form.attendanceCloseTime &&
        form.attendanceCloseTime < form.eventEndTime
      ) {
        throw new BadRequestException(
          'Attendance close time must be at or after event end time',
        );
      }
    }

    // ── Material Upload ──
    if (dto.materialUploadEnabled !== undefined)
      form.materialUploadEnabled = dto.materialUploadEnabled;

    return await this.forms.save(form);
  }

  async toggleFavorite(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    form.isFavorite = !form.isFavorite;
    return await this.forms.save(form);
  }

  async archiveForm(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    form.isArchived = true;
    return await this.forms.save(form);
  }

  async unarchiveForm(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    form.isArchived = false;
    return await this.forms.save(form);
  }

  async moveToTrash(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    form.isFavorite = false;
    form.isArchived = false;
    form.trashedAt = new Date();
    return await this.forms.save(form);
  }

  async restoreFromTrash(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    form.trashedAt = null;
    return await this.forms.save(form);
  }

  async permanentDelete(ownerId: number, id: number) {
    const form = await this.getMine(ownerId, id);
    
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', String(form.id));
      await fs.rm(uploadDir, { recursive: true, force: true });
    } catch (e) {}

    await this.forms.remove(form);
    return { deleted: true };
  }

  async deleteMine(ownerId: number, id: number) {
    return this.moveToTrash(ownerId, id);
  }

  async purgeOldTrash() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldForms = await this.forms.find({
      where: { trashedAt: LessThan(thirtyDaysAgo) },
      select: ['id'],
    });

    for (const f of oldForms) {
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', String(f.id));
        await fs.rm(uploadDir, { recursive: true, force: true });
      } catch (e) {}
    }

    if (oldForms.length > 0) {
      await this.forms.delete({
        trashedAt: LessThan(thirtyDaysAgo),
      });
    }
  }
}
