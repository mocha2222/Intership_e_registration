import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findById(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return await this.users.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string) {
    return await this.users.findOne({ where: { googleId } });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash?: string | null;
    googleId?: string | null;
    avatarUrl?: string | null;
    language?: 'en' | 'km';
  }) {
    const entity = this.users.create({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash ?? null,
      googleId: data.googleId ?? null,
      avatarUrl: data.avatarUrl ?? null,
      language: data.language ?? 'en',
    });
    return await this.users.save(entity);
  }

  async updateProfile(
    userId: number,
    data: {
      name?: string;
      username?: string;
      avatarUrl?: string | null;
      phoneNumber?: string | null;
      organizationName?: string | null;
      language?: 'en' | 'km';
    },
  ) {
    const user = await this.findById(userId);
    if (typeof data.name === 'string') user.name = data.name;
    if (typeof data.username === 'string') user.username = data.username;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.organizationName !== undefined)
      user.organizationName = data.organizationName;
    if (data.language !== undefined) user.language = data.language;
    return await this.users.save(user);
  }

  async save(user: UserEntity) {
    return await this.users.save(user);
  }
}
