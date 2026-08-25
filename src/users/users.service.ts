import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { FormEntity } from '../entities/form.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
  ) { }

  async findAll() {
    return await this.users.find({
      select: ['id', 'email', 'name', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return await this.users.findOne({ where: { email } });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    avatarUrl?: string | null;
  }) {
    const entity = this.users.create({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      avatarUrl: data.avatarUrl ?? null,
    });
    return await this.users.save(entity);
  }

  async delete(id: number) {
    const existing = await this.users.findOne({ where: { id }, select: ['id'] });
    if (!existing) throw new NotFoundException('User not found');

    const ownedForms = await this.forms.find({
      where: { ownerId: id },
      select: ['id'],
    });
    const formIds = ownedForms.map((f) => f.id);

    await this.users.manager.transaction(async (manager) => {
      await manager.getRepository(FormEntity).delete({ ownerId: id });
      await manager.getRepository(UserEntity).delete(id);
    });

    for (const formId of formIds) {
      const uploadDir = path.join(process.cwd(), 'uploads', String(formId));
      try {
        await fs.rm(uploadDir, { recursive: true, force: true });
      } catch (e) {

      }
    }
  }

  async updateProfile(
    userId: number,
    data: {
      name?: string;
      username?: string;
      avatarUrl?: string | null;
      phoneNumber?: string | null;
      organizationName?: string | null;
    },
  ) {
    const user = await this.findById(userId);
    if (typeof data.name === 'string') user.name = data.name;
    if (typeof data.username === 'string') user.username = data.username;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.organizationName !== undefined)
      user.organizationName = data.organizationName;
    return await this.users.save(user);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.findById(userId);

    if (!user.passwordHash) {
      throw new BadRequestException('This account does not have a password.');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.users.save(user);

    return { message: 'Password updated successfully.' };
  }

  async save(user: UserEntity) {
    return await this.users.save(user);
  }
}
