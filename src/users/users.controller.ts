import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserType) {
    const entity = await this.usersService.findById(user.userId);
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      username: entity.username,
      avatarUrl: entity.avatarUrl,
      phoneNumber: entity.phoneNumber,
      organizationName: entity.organizationName,
      language: entity.language,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    const entity = await this.usersService.updateProfile(user.userId, dto);
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      username: entity.username,
      avatarUrl: entity.avatarUrl,
      phoneNumber: entity.phoneNumber,
      organizationName: entity.organizationName,
      language: entity.language,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('language')
  async updateLanguage(
    @CurrentUser() user: CurrentUserType,
    @Body('language') language: 'en' | 'km',
  ) {
    const entity = await this.usersService.updateProfile(user.userId, { language });
    return {
      id: entity.id,
      language: entity.language,
    };
  }
}
