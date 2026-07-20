import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { OtpEntity } from '../entities/otp.entity';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    @InjectRepository(OtpEntity)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private signAccessToken(user: { id: number; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  private signAdminAccessToken(email: string) {
    return this.jwt.sign({ sub: 0, email, role: 'superadmin' });
  }

  // ─── Admin Login ──────────────────────────────────────────────────────────
  async adminLogin(dto: { email: string; password: string }) {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException('Admin credentials not configured');
    }

    if (dto.email !== adminEmail || dto.password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

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

  // ─── Generate a 6-digit numeric OTP ───────────────────────────────────────
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
        language: user.language,
      },
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: { email: string; password: string }) {
    // Check if admin credentials match first
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

    // Normal user login
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

  // ─── Google Login ─────────────────────────────────────────────────────────
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

  // ─── Forgot Password: Send OTP ────────────────────────────────────────────
  async sendPasswordResetOtp(email: string): Promise<{ message: string }> {
    // Always return success to prevent email enumeration attacks
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If this email is registered, an OTP has been sent.' };
    }

    // Remove any existing OTPs for this email
    await this.otpRepo.delete({ email });

    // Generate new OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Hash the code before saving to DB
    const hashedCode = await bcrypt.hash(code, 10);

    const otp = this.otpRepo.create({ email, code: hashedCode, expiresAt });
    await this.otpRepo.save(otp);

    // Send original code via email
    await this.mailService.sendPasswordResetOtp(email, code);

    return { message: 'If this email is registered, an OTP has been sent.' };
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  async verifyOtp(email: string, code: string): Promise<{ valid: boolean }> {
    const otp = await this.otpRepo.findOne({
      where: { email, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP.');

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await this.otpRepo.delete({ email });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (new Date() > otp.expiresAt) {
      await this.otpRepo.delete({ email });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    const isCodeValid = await bcrypt.compare(code, otp.code);
    if (!isCodeValid) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      const remaining = OTP_MAX_ATTEMPTS - otp.attempts;
      throw new BadRequestException(
        `Incorrect OTP. ${remaining} attempt(s) remaining.`,
      );
    }

    // OTP is valid — do NOT mark as used yet; wait for password reset
    return { valid: true };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const otp = await this.otpRepo.findOne({
      where: { email, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP.');

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await this.otpRepo.delete({ email });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (new Date() > otp.expiresAt) {
      await this.otpRepo.delete({ email });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    const isCodeValid = await bcrypt.compare(code, otp.code);
    if (!isCodeValid) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found.');

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.usersService.save(user);

    // Invalidate the OTP
    await this.otpRepo.delete({ email });

    return { message: 'Password has been reset successfully.' };
  }
}
