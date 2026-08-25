import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) { }

  private signAccessToken(user: { id: number; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  private signAdminAccessToken(email: string) {
    return this.jwt.sign({ sub: 0, email, role: 'superadmin' });
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  async register(dto: { email: string; password: string; name?: string }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const name = dto.name ?? dto.email.split('@')[0] ?? 'User';
    const user = await this.usersService.create({
      email: dto.email,
      name,
      passwordHash,
    });

    return {
      accessToken: this.signAccessToken(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: { email: string; password: string }) {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');
    if (adminEmail && adminPassword && dto.email === adminEmail && dto.password === adminPassword) {
      return {
        accessToken: this.signAdminAccessToken(dto.email),
        user: {
          id: 0,
          email: dto.email,
          name: 'Super Admin',
          role: 'superadmin',
        },
      };
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      accessToken: this.signAccessToken(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
