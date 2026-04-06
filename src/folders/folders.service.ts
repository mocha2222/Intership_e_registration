import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FolderEntity } from '../entities/folder.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(FolderEntity)
    private readonly folders: Repository<FolderEntity>,
  ) { }

  async create(
    ownerId: number,
    dto: { name: string; color?: string; parentId?: number },
  ) {
    if (dto.parentId) {
      const parent = await this.folders.findOne({
        where: { id: dto.parentId, ownerId },
      });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    const entity = this.folders.create({
      ownerId,
      name: dto.name,
      color: dto.color ?? '#4eaee7',
      parentId: dto.parentId ?? null,
    });
    return await this.folders.save(entity);
  }

  async listMine(ownerId: number) {
    return await this.folders.find({
      where: { ownerId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateMine(
    ownerId: number,
    id: number,
    dto: { name?: string; color?: string },
  ) {
    const folder = await this.folders.findOne({ where: { id, ownerId } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.color !== undefined) folder.color = dto.color;
    return await this.folders.save(folder);
  }

  async deleteMine(ownerId: number, id: number) {
    const folder = await this.folders.findOne({ where: { id, ownerId } });
    if (!folder) throw new NotFoundException('Folder not found');

    const allIds = [folder.id];
    for (let i = 0; i < allIds.length; i++) {
      const children = await this.folders.find({
        where: { parentId: allIds[i], ownerId },
      });
      allIds.push(...children.map((c) => c.id));
    }

    await this.folders.delete({ id: In(allIds) });
    return { deleted: true, ids: allIds };
  }
}
