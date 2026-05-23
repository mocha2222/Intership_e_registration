import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  // ─── Admin Endpoints ──────────────────────────────────────────────────────

  @Post('admin/login')
  async adminLogin(@Body() dto: LoginDto) {
    return await this.authService.adminLogin(dto);
  }

  @UseGuards(AdminGuard)
  @Post('admin/users')
  async adminCreateUser(@Body() dto: RegisterDto) {
    // Re-use authService register which creates user.
    // In a real app we might strip the returned accessToken, but it's fine for admin to just ignore it.
    return await this.authService.register(dto);
  }

  @UseGuards(AdminGuard)
  @Get('admin/users')
  async adminListUsers() {
    return await this.usersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Delete('admin/users/:id')
  async adminDeleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.delete(id);
    return { success: true };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as any;
    const result = await this.authService.loginWithGoogle(googleUser);

    const successRedirect = this.config.get<string>(
      'GOOGLE_SUCCESS_REDIRECT_URL',
    );

    if (successRedirect) {
      const url = new URL(successRedirect);
      url.searchParams.set('accessToken', result.accessToken);
      url.searchParams.set('userId', String(result.user.id));
      url.searchParams.set('email', result.user.email);
      url.searchParams.set('name', result.user.name);
      return res.redirect(url.toString());
    }

    return res.json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserType) {
    return user;
  }

  // ─── Forgot Password Endpoints ────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetOtp(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }
}
