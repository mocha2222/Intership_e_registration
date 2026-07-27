import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import {
  FormResponseEntity,
  AttendanceStatus,
  ScanLog,
} from '../entities/form-response.entity';
import { FormEntity } from '../entities/form.entity';

interface QRTokenPayload {
  responseId: string;
  formId: number;
  timestamp: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(FormResponseEntity)
    private responsesRepository: Repository<FormResponseEntity>,
    @InjectRepository(FormEntity)
    private formsRepository: Repository<FormEntity>,
  ) { }

  // ── QR Token Generation ──────────────────────────────────────────

  generateQRToken(
    responseId: string,
    formId: number,
    form: FormEntity,
  ): string {
    const payload: QRTokenPayload = {
      responseId,
      formId,
      timestamp: Date.now(),
    };

    // Generic 1 year expiration - deadline validation happens at scan time
    const expiresInSeconds: number = 365 * 86400; // 1 year

    return this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
      subject: 'qr-attendance',
    } as any);
  }

  // ── QR Token Verification ────────────────────────────────────────
  verifyQRToken(qrToken: string): QRTokenPayload {
    try {
      const payload = this.jwtService.verify<QRTokenPayload>(qrToken, {
        subject: 'qr-attendance',
      });
      return payload;
    } catch {
      throw new BadRequestException('Invalid QR code');
    }
  }

  // ── QR Code Image Generator ──────────────────────────────────────

  async generateQRCodeImage(qrToken: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrToken, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 4,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return qrDataUrl;
    } catch {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  // ── Time Validation Engine ───────────────────────────────────────

  validateAttendanceStatus(
    form: FormEntity,
    currentTime: Date = new Date(),
  ): AttendanceStatus {
    if (!form.eventEndTime && !form.attendanceCloseTime) {
      // No timing configured → default to present
      return 'present';
    }

    const scanTime = new Date(currentTime);

    if (form.attendanceCloseTime) {
      const closeTime = new Date(form.attendanceCloseTime);
      if (scanTime > closeTime) {
        return 'rejected';
      }
    }

    if (form.eventEndTime) {
      const lateDeadline = new Date(form.eventEndTime);
      if (scanTime > lateDeadline) {
        return 'late';
      }
    }

    return 'present';
  }


  async processCheckIn(
    response: FormResponseEntity,
    form: FormEntity,
    currentTime: Date = new Date(),
    deviceInfo?: { userAgent?: string; ipAddress?: string },
  ): Promise<{
    status: AttendanceStatus | 'duplicate';
    updated: boolean;
    scanLog: ScanLog;
    message: string;
  }> {

    if (!form.attendanceEnabled) {
      throw new BadRequestException('Attendance tracking is not enabled for this form');
    }

    if (response.status !== 'pending') {
      const duplicateLog: ScanLog = {
        timestamp: currentTime,
        result: 'duplicate',
        deviceInfo,
      };

      const logs = Array.isArray(response.scanLogs)
        ? [...response.scanLogs, duplicateLog]
        : [duplicateLog];

      await this.responsesRepository.update(
        { id: response.id },
        { scanLogs: logs },
      );

      return {
        status: 'duplicate',
        updated: false,
        scanLog: duplicateLog,
        message: `Already checked in (Original Status: ${response.status})`,
      };
    }

    const newStatus = this.validateAttendanceStatus(form, currentTime);
    const scanLog: ScanLog = {
      timestamp: currentTime,
      result: newStatus as 'present' | 'late' | 'rejected',
      deviceInfo,
    };

    const logs = Array.isArray(response.scanLogs)
      ? [...response.scanLogs, scanLog]
      : [scanLog];

    const updateResult = await this.responsesRepository.update(
      { id: response.id, status: 'pending' as AttendanceStatus },
      {
        status: newStatus,
        checkInTime: currentTime,
        scanLogs: logs,
      },
    );

    const wasUpdated = (updateResult.affected ?? 0) > 0;

    if (!wasUpdated) {
      const current = await this.responsesRepository.findOne({
        where: { id: response.id },
      });
      return {
        status: current?.status || response.status,
        updated: false,
        scanLog,
        message: 'Already processed by another scan',
      };
    }

    const messages: Record<string, string> = {
      present: 'Check-in successful — marked as present',
      late: 'Check-in successful — marked as late',
      rejected: 'Attendance period has ended. No further check-ins allowed.',
    };

    return {
      status: newStatus,
      updated: true,
      scanLog,
      message: messages[newStatus] || `Status: ${newStatus}`,
    };
  }

  calculateEffectiveStatus(
    response: FormResponseEntity,
    form: FormEntity,
    currentTime: Date = new Date(),
  ): AttendanceStatus {
    if (response.status !== 'pending') {
      return response.status;
    }

    if (
      form.attendanceCloseTime &&
      currentTime > new Date(form.attendanceCloseTime)
    ) {
      return 'absent';
    }

    return 'pending';
  }

  async markAbsentResponses(
    form: FormEntity,
    currentTime: Date = new Date(),
  ): Promise<number> {
    if (!form.attendanceCloseTime) return 0;

    const closeTime = new Date(form.attendanceCloseTime);
    if (currentTime <= closeTime) return 0;

    const result = await this.responsesRepository.update(
      { formId: form.id, status: 'pending' as AttendanceStatus },
      { status: 'absent' as AttendanceStatus },
    );

    return result.affected || 0;
  }

  formatResponseData(
    response: FormResponseEntity,
  ): Array<{ questionId: string; label: string; value: string }> {
    const formatted: Array<{
      questionId: string;
      label: string;
      value: string;
    }> = [];

    if (!response.formData || typeof response.formData !== 'object') {
      return formatted;
    }

    for (const [qId, qData] of Object.entries(response.formData)) {
      if (
        qData &&
        typeof qData === 'object' &&
        'label' in qData &&
        'value' in qData
      ) {
        formatted.push({
          questionId: qId,
          label: qData.label,
          value: String(qData.value || ''),
        });
      }
    }

    return formatted;
  }
}
