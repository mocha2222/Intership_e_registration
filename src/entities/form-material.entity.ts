import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FormEntity } from './form.entity';

@Entity('form_materials')
export class FormMaterialEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  formId!: number;

  @ManyToOne(() => FormEntity, (form) => form.materials, { onDelete: 'CASCADE' })
  form!: FormEntity;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 255 })
  storedFilename!: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'int' })
  size!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
