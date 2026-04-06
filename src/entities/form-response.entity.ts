// ENHANCED FormResponse Entity with QR Token and Status
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FormEntity } from './form.entity';

/**
 * AttendanceStatus: pending | present | late | rejected | absent
 * - pending: Form submitted, not yet scanned
 * - present: Scanned before eventEndTime
 * - late: Scanned between eventEndTime and attendanceCloseTime
 * - rejected: Scanned after attendanceCloseTime (too late)
 * - absent: Never scanned after attendanceCloseTime (automatic)
 */
export type AttendanceStatus = 'pending' | 'present' | 'late' | 'rejected' | 'absent';

/**
 * ScanLog: Detailed audit trail of each QR scan
 */
export interface ScanLog {
  timestamp: Date;
  result: 'present' | 'late' | 'rejected' | 'duplicate' | 'error';
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  };
  error?: string;
}

@Entity('form_responses')
export class FormResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  formId!: number;

  @ManyToOne(() => FormEntity, (form) => form.responses, { onDelete: 'CASCADE' })
  form!: FormEntity;

  @Index()
  @Column({ nullable: true })
  userId!: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  user!: UserEntity | null;

  /**
   * JWT signed token: {responseId, formId, timestamp}
   * This is what gets encoded into the QR code
   * IMPORTANT: QR code contains ONLY this token, not formData
   */
  @Column({ type: 'text' })
  qrToken!: string;

  /**
   * Dynamic form data in the required format:
   * {
   *   "q1": {
   *     "label": "What is your name?",
   *     "value": "John Doe"
   *   },
   *   "q2": {
   *     "label": "What is your email?",
   *     "value": "john@example.com"
   *   }
   * }
   * 
   * Keys are question IDs from form.pages[].elements[].id
   */
  @Column({ type: 'json', nullable: true })
  formData!: Record<
    string,
    {
      label: string;
      value: any;
    }
  > | null;

  /**
   * Attendance status based on scan time validation
   */
  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status!: AttendanceStatus;

  /**
   * When the form was submitted (response created)
   */
  @CreateDateColumn()
  submittedAt!: Date;

  /**
   * When the QR code was scanned (attendance checked in)
   * NULL if not yet scanned
   */
  @Column({ type: 'datetime', nullable: true })
  checkInTime!: Date | null;

  /**
   * Detailed scan audit trail with timestamps and results
   * Replaces simple scanCount with full logging
   * 
   * Example:
   * [
   *   {
   *     timestamp: 2024-01-15T14:30:00Z,
   *     result: "present",
   *     deviceInfo: { userAgent: "...", ipAddress: "..." }
   *   },
   *   {
   *     timestamp: 2024-01-15T14:31:05Z,
   *     result: "duplicate",
   *     deviceInfo: { ... }
   *   }
   * ]
   */
  @Column({
    type: 'json',
    nullable: true,
  })
  scanLogs!: ScanLog[];

  /**
   * Additional metadata (optional)
   * Can store device info, IP address, etc.
   */
  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
