import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private signAccessToken(user: { id: number; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

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
        language: user.language,
      },
    };
  }

  async login(dto: { email: string; password: string }) {
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
        language: user.language,
      },
    };
  }

  async loginWithGoogle(googleUser: {
    googleId: string;
    email: string | null;
    name: string;
    avatarUrl: string | null;
  }) {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user && googleUser.email) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user && !user.googleId) {
        user.googleId = googleUser.googleId;
        if (!user.avatarUrl && googleUser.avatarUrl)
          user.avatarUrl = googleUser.avatarUrl;
        if (!user.name && googleUser.name) user.name = googleUser.name;
        user = await this.usersService.save(user);
      }
    }

    if (!user) {
      if (!googleUser.email)
        throw new UnauthorizedException('Google account has no email');
      user = await this.usersService.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        passwordHash: null,
      });
    }

    return {
      accessToken: this.signAccessToken(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        language: user.language,
      },
    };
  }
}
