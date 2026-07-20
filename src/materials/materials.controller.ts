import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MaterialsService } from './materials.service';

@Controller('forms')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/materials')
  @UseInterceptors(FilesInterceptor('files', 10))
  async upload(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.materialsService.upload(user.userId, Number(id), files);
  }

  @Get(':shareToken/materials')
  async list(@Param('shareToken') shareToken: string) {
    return await this.materialsService.listByForm(shareToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':formId/materials/:materialId')
  async deleteOne(
    @CurrentUser() user: CurrentUserType,
    @Param('formId') formId: string,
    @Param('materialId') materialId: string,
  ) {
    return await this.materialsService.deleteOne(
      user.userId,
      Number(formId),
      Number(materialId),
    );
  }
}
