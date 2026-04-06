import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../entities/user.entity';
import { FormEntity } from '../entities/form.entity';
import { FormResponseEntity } from '../entities/form-response.entity';
import { FolderEntity } from '../entities/folder.entity';
import { AttendanceEntity } from '../entities/attendance.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, FormEntity, FormResponseEntity, FolderEntity, AttendanceEntity],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
});
