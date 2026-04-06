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

export type AttendanceStatus = 'pending' | 'present' | 'late' | 'rejected' | 'absent';

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


  @Column({ type: 'text' })
  qrToken!: string;


  @Column({ type: 'json', nullable: true })
  formData!: Record<
    string,
    {
      label: string;
      value: any;
    }
  > | null;

  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status!: AttendanceStatus;

  @CreateDateColumn()
  submittedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  checkInTime!: Date | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  scanLogs!: ScanLog[];

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
