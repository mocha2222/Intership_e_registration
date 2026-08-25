import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateFormDto,
  ) {
    return await this.formsService.create(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listMine(
    @CurrentUser() user: CurrentUserType,
    @Query('filter')
    filter?: 'active' | 'favorites' | 'archived' | 'trash' | 'all',
  ) {
    return await this.formsService.listMine(user.userId, filter);
  }

  @Get(':shareToken/public')
  async getPublic(@Param('shareToken') shareToken: string) {
    return await this.formsService.getPublic(shareToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMine(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    const numId = Number(id);
    if (isNaN(numId)) throw new NotFoundException('Form not found');
    return await this.formsService.getMine(user.userId, numId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateMine(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
  ) {
    const numId = Number(id);
    if (isNaN(numId)) throw new NotFoundException('Form not found');
    return await this.formsService.updateMine(user.userId, numId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/favorite')
  async toggleFavorite(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.toggleFavorite(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/archive')
  async archiveForm(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.archiveForm(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/unarchive')
  async unarchiveForm(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.unarchiveForm(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/trash')
  async moveToTrash(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.moveToTrash(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  async restoreFromTrash(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.restoreFromTrash(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/permanent')
  async permanentDelete(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.permanentDelete(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteMine(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    return await this.formsService.deleteMine(user.userId, Number(id));
  }
}
