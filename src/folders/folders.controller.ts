import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateFolderDto,
  ) {
    return await this.foldersService.create(user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: CurrentUserType) {
    return await this.foldersService.listMine(user.userId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return await this.foldersService.updateMine(user.userId, Number(id), dto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return await this.foldersService.deleteMine(user.userId, Number(id));
  }
}
