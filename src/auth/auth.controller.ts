import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }


  @UseGuards(AdminGuard)
  @Post('admin/users')
  async adminCreateUser(@Body() dto: RegisterDto) {
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
