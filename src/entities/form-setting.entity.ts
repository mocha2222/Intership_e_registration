import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { FormEntity } from './form.entity';

@Entity('form_settings')
export class FormSettingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  formId: number;

  @OneToOne(() => FormEntity, form => form.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: FormEntity;

  @Column({ type: 'datetime', nullable: true })
  submissionStartTime: string | null;

  @Column({ type: 'datetime', nullable: true })
  submissionEndTime: string | null;

  @Column({ type: 'varchar', default: 'submit_and_view' })
  permissionMode: string;

  @Column({ type: 'boolean', default: false })
  materialUploadEnabled: boolean;

  @Column({ type: 'datetime', nullable: true })
  expirationAt: string | null;

  @Column({ type: 'int', nullable: true })
  submissionLimit: number | null;
}
