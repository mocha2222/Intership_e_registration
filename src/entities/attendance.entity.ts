import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FormEntity } from './form.entity';
import { UserEntity } from './user.entity';

@Entity('attendance')
@Unique(['formId', 'userId'])
export class AttendanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  formId!: number;

  @ManyToOne(() => FormEntity, undefined, { onDelete: 'CASCADE' })
  form!: FormEntity;

  @Index()
  @Column()
  userId!: number;

  @ManyToOne(() => UserEntity, undefined, { onDelete: 'CASCADE' })
  user!: UserEntity;

  @CreateDateColumn({ type: 'datetime' })
  checkedInAt!: Date;
}
