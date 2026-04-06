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

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  ownerId!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  owner!: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 20, default: '#4eaee7' })
  color!: string;

  @Column({ type: 'int', nullable: true })
  parentId!: number | null;

  @ManyToOne(() => FolderEntity, (f) => f.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent!: FolderEntity | null;

  @OneToMany(() => FolderEntity, (f) => f.parent)
  children!: FolderEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
