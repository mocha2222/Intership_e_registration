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

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
  ) { }

  async create(ownerId: number, dto: CreateFormDto) {
    const entity = this.forms.create({
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

  async getPublic(id: number) {
    const form = await this.forms.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    if (!form.isPublished) throw new NotFoundException('Form not found');
    return form;
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
    if (dto.pages !== undefined) form.pages = dto.pages;
    if (dto.nextElementId !== undefined) form.nextElementId = dto.nextElementId;
    if (dto.logoUrl !== undefined) form.logoUrl = dto.logoUrl ?? null;
    if (dto.design !== undefined) form.design = dto.design;
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
    await this.forms.remove(form);
    return { deleted: true };
  }

  async deleteMine(ownerId: number, id: number) {
    return this.moveToTrash(ownerId, id);
  }

  async purgeOldTrash() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await this.forms.delete({
      trashedAt: LessThan(thirtyDaysAgo),
    });
  }
}
