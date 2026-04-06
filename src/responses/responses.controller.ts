// Response Controller: Form submission + listing + deletion
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  /**
   * POST /responses/:formId
   * Public endpoint — submit a form response
   * Returns: { id, formId, status, qrToken, submittedAt }
   */
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

  /**
   * GET /responses/form/:formId
   * Owner-only: list all responses for a form
   */
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

  /**
   * GET /responses/:responseId
   * Get a single response with formatted formData
   */
  @Get(':responseId')
  async getResponse(@Param('responseId') responseId: string) {
    return await this.responsesService.getResponse(responseId);
  }

  /**
   * DELETE /responses/:responseId
   * Owner-only: delete a response
   */
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
}
