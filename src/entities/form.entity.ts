// ENHANCED Form Entity with Attendance Timing
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FormResponseEntity } from './form-response.entity';

@Entity('forms')
export class FormEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  ownerId!: number;

  @ManyToOne(() => UserEntity, (user) => user.forms, { onDelete: 'CASCADE' })
  owner!: UserEntity;

  @Column({ type: 'varchar', length: 140 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'json', nullable: true })
  schema!: unknown;

  // ── Rich form data ──────────────────────────────────
  @Column({ type: 'varchar', length: 30, default: 'enabled' })
  status!: string;

  @Column({ type: 'varchar', length: 30, default: 'classic' })
  layoutType!: string;

  @Column({ type: 'varchar', length: 100, default: 'all' })
  folderKey!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label!: string | null;

  @Column({ type: 'json', nullable: true })
  pages!: unknown;

  @Column({ type: 'int', default: 1 })
  nextElementId!: number;

  @Column({ type: 'longtext', nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'json', nullable: true })
  design!: unknown;

  // ── Types & Features ────────────────────────────────
  @Column({ type: 'varchar', length: 30, default: 'form' })
  type!: string; // form | attendance (legacy — kept for backward compat)

  @Column({ type: 'boolean', default: false })
  attendanceEnabled!: boolean;

  // ── Submission Timing (ALL forms) ─────────────────────
  @Column({ type: 'datetime', nullable: true })
  submissionStartTime!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  submissionEndTime!: Date | null;

  // ── ATTENDANCE TIMING (NEW) ──────────────────────────
  /**
   * When the event/form starts
   * Users can ONLY submit after this time
   */
  @Column({ type: 'datetime', nullable: true })
  eventStartTime!: Date | null;

  /**
   * When the event ends
   * Scans before this time = "present"
   */
  @Column({ type: 'datetime', nullable: true })
  eventEndTime!: Date | null;

  /**
   * Extended deadline for late arrivals
   * Scans between eventEndTime and attendanceCloseTime = "late"
   * Scans after this time = "rejected"
   */
  @Column({ type: 'datetime', nullable: true })
  attendanceCloseTime!: Date | null;

  // ── State flags ─────────────────────────────────────
  @Index()
  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'datetime', nullable: true })
  trashedAt!: Date | null;

  // ── Access / Permissions ────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'public' })
  accessMode!: string;

  @Column({ type: 'varchar', length: 30, default: 'submit_and_view' })
  permissionMode!: string;

  @OneToMany(() => FormResponseEntity, (r) => r.form)
  responses!: FormResponseEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
