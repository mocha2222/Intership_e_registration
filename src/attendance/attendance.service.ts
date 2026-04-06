// Attendance Service: QR Token Generation, Validation, Status Management
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
  ) {}

  // ── QR Token Generation ──────────────────────────────────────────

  /**
   * Generate QR Token (JWT signed)
   *
   * RULE: JWT expiration = attendanceCloseTime
   *       Fallback to eventEndTime if attendanceCloseTime is null
   *       Default 24h if neither is set
   */
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

    // Calculate JWT expiration based on form timing
    let expiresInSeconds: number = 86400; // Default 24h

    const deadline = form.attendanceCloseTime || form.eventEndTime;
    if (deadline) {
      const deadlineTime = new Date(deadline);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const deadlineSeconds = Math.floor(deadlineTime.getTime() / 1000);
      const secondsUntilDeadline = deadlineSeconds - nowSeconds;

      if (secondsUntilDeadline > 0) {
        expiresInSeconds = secondsUntilDeadline;
      } else {
        // Already past deadline, set short expiration (1 minute)
        expiresInSeconds = 60;
      }
    }

    return this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
      subject: 'qr-attendance',
    } as any);
  }

  // ── QR Token Verification ────────────────────────────────────────

  /**
   * Verify and decode QR Token
   * @throws BadRequestException if token is invalid or expired
   */
  verifyQRToken(qrToken: string): QRTokenPayload {
    try {
      const payload = this.jwtService.verify<QRTokenPayload>(qrToken, {
        subject: 'qr-attendance',
      });
      return payload;
    } catch {
      throw new BadRequestException('Invalid or expired QR code');
    }
  }

  // ── QR Code Image Generator ──────────────────────────────────────

  /**
   * Generate QR Code Image from token
   * QR code contains ONLY the token string, never formData
   */
  async generateQRCodeImage(qrToken: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrToken, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return qrDataUrl;
    } catch {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  // ── Time Validation Engine ───────────────────────────────────────

  /**
   * Determine attendance status based on current time vs event timing
   *
   * Rules:
   *   currentTime <= eventEndTime        → "present"
   *   currentTime <= attendanceCloseTime → "late"
   *   else                               → "rejected"
   */
  validateAttendanceStatus(
    form: FormEntity,
    currentTime: Date = new Date(),
  ): AttendanceStatus {
    if (!form.eventEndTime && !form.attendanceCloseTime) {
      // No timing configured → default to present
      return 'present';
    }

    const scanTime = new Date(currentTime);

    if (form.eventEndTime) {
      const endTime = new Date(form.eventEndTime);
      if (scanTime <= endTime) {
        return 'present';
      }
    }

    if (form.attendanceCloseTime) {
      const closeTime = new Date(form.attendanceCloseTime);
      if (scanTime <= closeTime) {
        return 'late';
      }
    }

    return 'rejected';
  }

  // ── Atomic Check-In (Race Condition Safe) ────────────────────────

  /**
   * Process check-in with ATOMIC update and audit logging
   *
   * CRITICAL: Uses UPDATE ... WHERE status = 'pending'
   * Only the FIRST concurrent scan succeeds. All others get affected=0
   */
  async processCheckIn(
    response: FormResponseEntity,
    form: FormEntity,
    currentTime: Date = new Date(),
    deviceInfo?: { userAgent?: string; ipAddress?: string },
  ): Promise<{
    status: AttendanceStatus;
    updated: boolean;
    scanLog: ScanLog;
    message: string;
  }> {
    // ── Attendance must be enabled ──
    if (!form.attendanceEnabled) {
      throw new BadRequestException('Attendance tracking is not enabled for this form');
    }

    // ── Duplicate detection (already scanned) ──
    if (response.status !== 'pending') {
      const duplicateLog: ScanLog = {
        timestamp: currentTime,
        result: 'duplicate',
        deviceInfo,
      };

      // Append duplicate log without changing status
      const logs = Array.isArray(response.scanLogs)
        ? [...response.scanLogs, duplicateLog]
        : [duplicateLog];

      await this.responsesRepository.update(
        { id: response.id },
        { scanLogs: logs },
      );

      return {
        status: response.status,
        updated: false,
        scanLog: duplicateLog,
        message: `Already checked in (status: ${response.status})`,
      };
    }

    // ── First scan: Determine status from time rules ──
    const newStatus = this.validateAttendanceStatus(form, currentTime);
    const scanLog: ScanLog = {
      timestamp: currentTime,
      result: newStatus as 'present' | 'late' | 'rejected',
      deviceInfo,
    };

    const logs = Array.isArray(response.scanLogs)
      ? [...response.scanLogs, scanLog]
      : [scanLog];

    // ── ATOMIC UPDATE: only succeeds if status is STILL 'pending' ──
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
      // Another request already updated—fetch fresh status
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
      rejected: 'Check-in rejected — past attendance deadline',
    };

    return {
      status: newStatus,
      updated: true,
      scanLog,
      message: messages[newStatus] || `Status: ${newStatus}`,
    };
  }

  // ── Absent Calculation ───────────────────────────────────────────

  /**
   * Calculate effective status (e.g., pending → absent after close time)
   */
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

  /**
   * Batch update: Mark all pending responses as absent after close time
   */
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

  // ── Display Helper ──────────────────────────────────────────────

  /**
   * Format response formData for display: label + value pairs
   */
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
