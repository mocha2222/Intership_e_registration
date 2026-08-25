// Attendance Controller: QR scan endpoint with role-based access
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { CheckinDto, ManualPhoneCheckinDto } from './dto/attendance.dto';
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
  ) { }

  // ── POST /attendance/scan ────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('scan')
  @HttpCode(200)
  async scan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CheckinDto,
    @Req() req: Request,
  ) {
    const payload = this.attendanceService.verifyQRToken(dto.token);

    const response = await this.responsesRepository.findOne({
      where: { id: payload.responseId },
      relations: ['form'],
    });

    if (!response || !response.form) {
      throw new NotFoundException('Response not found');
    }

    const form = response.form;

    if (form.ownerId !== user.userId) {
      throw new ForbiddenException(
        'Only the form creator can check-in responses',
      );
    }
    const deviceInfo = {
      userAgent: req.get?.('user-agent'),
      ipAddress: req.ip || req.socket?.remoteAddress,
    };

    const result = await this.attendanceService.processCheckIn(
      response,
      form,
      new Date(),
      deviceInfo,
    );

    return this.formatCheckinResult(response, result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manual-phone')
  @HttpCode(200)
  async manualPhoneScan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ManualPhoneCheckinDto,
    @Req() req: Request,
  ) {
    const phoneDigits = this.normalizePhone(dto.phoneNumber);
    if (phoneDigits.length < 7) {
      throw new BadRequestException('Please enter at least 7 phone digits');
    }

    const responses = await this.responsesRepository
      .createQueryBuilder('response')
      .innerJoinAndSelect('response.form', 'form')
      .where('form.ownerId = :ownerId', { ownerId: user.userId })
      .andWhere('form.attendanceEnabled = :attendanceEnabled', {
        attendanceEnabled: true,
      })
      .orderBy('response.submittedAt', 'DESC')
      .getMany();

    const matches = responses.filter((response) =>
      this.responseHasPhoneNumber(response, phoneDigits),
    );

    if (matches.length === 0) {
      throw new NotFoundException('No attendance response found for this phone number');
    }

    if (matches.length > 1) {
      throw new BadRequestException(
        'Multiple responses match this phone number. Please use the QR code instead.',
      );
    }

    const response = matches[0];
    const form = response.form;

    const deviceInfo = {
      userAgent: req.get?.('user-agent'),
      ipAddress: req.ip || req.socket?.remoteAddress,
    };

    const result = await this.attendanceService.processCheckIn(
      response,
      form,
      new Date(),
      deviceInfo,
    );

    return this.formatCheckinResult(response, result);
  }

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

  private normalizePhone(value: unknown): string {
    return String(value ?? '').replace(/\D/g, '');
  }

  private phoneMatches(candidate: string, target: string): boolean {
    if (candidate === target) return true;
    if (candidate.length < 7 || target.length < 7) return false;
    return candidate.endsWith(target) || target.endsWith(candidate);
  }

  private isPhoneLikeField(label: string, key: string): boolean {
    const text = `${label} ${key}`.toLowerCase();
    return (
      text.includes('phone') ||
      text.includes('mobile') ||
      text.includes('tel') ||
      text.includes('contact')
    );
  }

  private responseHasPhoneNumber(
    response: FormResponseEntity,
    phoneDigits: string,
  ): boolean {
    if (!response.formData || typeof response.formData !== 'object') return false;

    for (const [key, entry] of Object.entries(response.formData)) {
      const e = entry as any;
      if (!this.isPhoneLikeField(String(e?.label || ''), key)) continue;

      const valueDigits = this.normalizePhone(e?.value);
      if (this.phoneMatches(valueDigits, phoneDigits)) return true;
    }

    return false;
  }

  private formatCheckinResult(
    response: FormResponseEntity,
    result: Awaited<ReturnType<AttendanceService['processCheckIn']>>,
  ) {
    const respondent = this.extractRespondentInfo(response);

    const formDataDisplay: Record<string, any> = {};
    if (response.formData && typeof response.formData === 'object') {
      for (const [key, entry] of Object.entries(response.formData)) {
        const e = entry as any;
        if (e?.label && e?.value != null) {
          formDataDisplay[e.label] = e.value;
        }
      }
    }

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
