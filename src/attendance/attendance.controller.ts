// Attendance Controller: QR scan endpoint with role-based access
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { CheckinDto } from './dto/attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormResponseEntity } from '../entities/form-response.entity';
import { FormEntity } from '../entities/form.entity';
import type { Request } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    @InjectRepository(FormResponseEntity)
    private readonly responsesRepository: Repository<FormResponseEntity>,
    @InjectRepository(FormEntity)
    private readonly formsRepository: Repository<FormEntity>,
  ) {}

  // ── POST /attendance/scan ────────────────────────────────────────
  // The main QR scan endpoint for event creators
  @UseGuards(JwtAuthGuard)
  @Post('scan')
  @HttpCode(200)
  async scan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CheckinDto,
    @Req() req: Request,
  ) {
    // 1. Verify JWT token from QR code
    const payload = this.attendanceService.verifyQRToken(dto.token);

    // 2. Fetch response + form
    const response = await this.responsesRepository.findOne({
      where: { id: payload.responseId },
      relations: ['form'],
    });

    if (!response || !response.form) {
      throw new NotFoundException('Response not found');
    }

    const form = response.form;

    // 3. ROLE-BASED ACCESS: only form owner can scan
    if (form.ownerId !== user.userId) {
      throw new ForbiddenException(
        'Only the form creator can check-in responses',
      );
    }

    // 4. Device info for audit trail
    const deviceInfo = {
      userAgent: req.get?.('user-agent'),
      ipAddress: req.ip || req.socket?.remoteAddress,
    };

    // 5. Process check-in (atomic update + time validation)
    const result = await this.attendanceService.processCheckIn(
      response,
      form,
      new Date(),
      deviceInfo,
    );

    // 6. Extract respondent info from formData
    const respondent = this.extractRespondentInfo(response);

    // 7. Build formData key/value display
    const formDataDisplay: Record<string, any> = {};
    if (response.formData && typeof response.formData === 'object') {
      for (const [key, entry] of Object.entries(response.formData)) {
        const e = entry as any;
        if (e?.label && e?.value != null) {
          formDataDisplay[e.label] = e.value;
        }
      }
    }

    // 8. Build response
    return {
      success: ['present', 'late'].includes(result.status),
      status: result.status,
      message: result.message,
      isDuplicate: !result.updated,
      checkInTime: result.scanLog.timestamp,
      respondent,
      formData: formDataDisplay,
      scanLog: {
        timestamp: result.scanLog.timestamp,
        result: result.scanLog.result,
      },
    };
  }

  // ── GET /attendance/form/:formId/report ──────────────────────────
  // Attendance report with absent calculation
  @UseGuards(JwtAuthGuard)
  @Get('form/:formId/report')
  async getReport(
    @CurrentUser() user: CurrentUserType,
    @Param('formId') formId: string,
  ) {
    const form = await this.formsRepository.findOne({
      where: { id: parseInt(formId) },
    });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== user.userId) {
      throw new ForbiddenException('Not allowed');
    }

    const responses = await this.responsesRepository.find({
      where: { formId: parseInt(formId) },
      order: { submittedAt: 'DESC' },
    });

    const now = new Date();
    const report = responses.map((r) => {
      const effectiveStatus = this.attendanceService.calculateEffectiveStatus(
        r,
        form,
        now,
      );
      return {
        responseId: r.id,
        status: effectiveStatus,
        actualDbStatus: r.status,
        submittedAt: r.submittedAt,
        checkInTime: r.checkInTime,
        respondent: this.extractRespondentInfo(r),
        scanLogsCount: (r.scanLogs || []).length,
      };
    });

    const stats = {
      total: responses.length,
      present: report.filter((r) => r.status === 'present').length,
      late: report.filter((r) => r.status === 'late').length,
      rejected: report.filter((r) => r.status === 'rejected').length,
      absent: report.filter((r) => r.status === 'absent').length,
      pending: report.filter((r) => r.status === 'pending').length,
    };

    return {
      form: {
        id: form.id,
        title: form.title,
        eventStartTime: form.eventStartTime,
        eventEndTime: form.eventEndTime,
        attendanceCloseTime: form.attendanceCloseTime,
      },
      stats,
      responses: report,
    };
  }

  // ── POST /attendance/form/:formId/mark-absent ────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('form/:formId/mark-absent')
  async markAbsent(
    @CurrentUser() user: CurrentUserType,
    @Param('formId') formId: string,
  ) {
    const form = await this.formsRepository.findOne({
      where: { id: parseInt(formId) },
    });
    if (!form) throw new NotFoundException('Form not found');
    if (form.ownerId !== user.userId) {
      throw new ForbiddenException('Not allowed');
    }

    const updatedCount =
      await this.attendanceService.markAbsentResponses(form);

    return {
      message: `Marked ${updatedCount} responses as absent`,
      updatedCount,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private extractRespondentInfo(response: FormResponseEntity): {
    name?: string;
    email?: string;
  } {
    if (!response.formData) return {};

    let name: string | undefined;
    let email: string | undefined;

    const nameKeys = [
      'el_fullname',
      'fullname',
      'name',
      'q_name',
      'q1',
      'el_1',
    ];
    const emailKeys = ['el_email', 'email', 'q_email', 'q2', 'el_2'];

    for (const key of nameKeys) {
      if (response.formData[key]?.value) {
        name = String(response.formData[key].value);
        break;
      }
    }
    for (const key of emailKeys) {
      if (response.formData[key]?.value) {
        email = String(response.formData[key].value);
        break;
      }
    }

    // Fallback: first field = name
    if (!name) {
      const first = Object.values(response.formData)[0];
      if (first?.value) name = String(first.value);
    }

    return { name, email };
  }
}
