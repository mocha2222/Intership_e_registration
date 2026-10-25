import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FormResponseEntity } from './form-response.entity';
import { FormMaterialEntity } from './form-material.entity';
import { FolderEntity } from './folder.entity';
import { FormSettingEntity } from './form-setting.entity';
import { FormAttendanceEntity } from './form-attendance.entity';

@Entity('forms')
export class FormEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  shareToken!: string;

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

  @Index()
  @Column({ type: 'int', nullable: true })
  folderId!: number | null;

  @ManyToOne(() => FolderEntity, { onDelete: 'SET NULL', nullable: true })
  folder!: FolderEntity | null;

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
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'datetime', nullable: true })
  trashedAt!: Date | null;

  @OneToOne(() => FormSettingEntity, s => s.form)
  settings!: FormSettingEntity;

  @OneToOne(() => FormAttendanceEntity, a => a.form)
  attendance!: FormAttendanceEntity;

  @OneToMany(() => FormResponseEntity, (r) => r.form)
  responses!: FormResponseEntity[];

  @OneToMany(() => FormMaterialEntity, (m) => m.form)
  materials!: FormMaterialEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
