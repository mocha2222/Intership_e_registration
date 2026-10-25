import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { FormEntity } from './form.entity';

@Entity('form_attendances')
export class FormAttendanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  formId: number;

  @OneToOne(() => FormEntity, form => form.attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form: FormEntity;

  @Column({ type: 'boolean', default: false })
  attendanceEnabled: boolean;

  @Column({ type: 'datetime', nullable: true })
  eventStartTime: string | null;

  @Column({ type: 'datetime', nullable: true })
  eventEndTime: string | null;

  @Column({ type: 'datetime', nullable: true })
  attendanceCloseTime: string | null;
}
