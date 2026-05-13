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
import { FormMaterialEntity } from './form-material.entity';

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

  @Column({ type: 'varchar', length: 30, default: 'form' })
  type!: string;

  @Column({ type: 'boolean', default: false })
  attendanceEnabled!: boolean;

  @Column({ type: 'datetime', nullable: true })
  submissionStartTime!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  submissionEndTime!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  eventStartTime!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  eventEndTime!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  attendanceCloseTime!: Date | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'datetime', nullable: true })
  trashedAt!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  accessMode!: string;

  @Column({ type: 'varchar', length: 30, default: 'submit_and_view' })
  permissionMode!: string;

  @Column({ type: 'boolean', default: false })
  materialUploadEnabled!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  expirationDate!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  expirationTime!: string | null;

  @Column({ type: 'int', nullable: true })
  submissionLimit!: number | null;

  @OneToMany(() => FormResponseEntity, (r) => r.form)
  responses!: FormResponseEntity[];

  @OneToMany(() => FormMaterialEntity, (m) => m.form)
  materials!: FormMaterialEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
