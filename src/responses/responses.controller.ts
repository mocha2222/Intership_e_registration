import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) { }

  @Post(':formId')
  async submit(
    @Param('formId') formId: string,
    @Body()
    body: {
      respondentEmail?: string;
      answers: Record<string, any>;
      formData?: Record<string, { label: string; value: any }>;
    },
  ) {
    return await this.responsesService.submit(Number(formId), body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('form/:formId')
  async listForOwner(
    @CurrentUser() user: CurrentUserType,
    @Param('formId') formId: string,
  ) {
    return await this.responsesService.listForOwner(
      user.userId,
      Number(formId),
    );
  }

  @Get(':responseId')
  async getResponse(@Param('responseId') responseId: string) {
    return await this.responsesService.getResponse(responseId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':responseId')
  async deleteResponse(
    @CurrentUser() user: CurrentUserType,
    @Param('responseId') responseId: string,
  ) {
    return await this.responsesService.deleteResponse(
      user.userId,
      responseId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':responseId')
  async updateResponse(
    @CurrentUser() user: CurrentUserType,
    @Param('responseId') responseId: string,
    @Body()
    body: {
      status?: any;
      formData?: Record<string, { label: string; value: any }>;
    },
  ) {
    return await this.responsesService.update(user.userId, responseId, body);
  }
}
