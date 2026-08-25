import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { UserEntity } from '../entities/user.entity';
import { FormEntity } from '../entities/form.entity';
import { FormResponseEntity } from '../entities/form-response.entity';
import { FolderEntity } from '../entities/folder.entity';
import { FormMaterialEntity } from '../entities/form-material.entity';

dotenv.config();

const isTypeScriptRuntime = __filename.endsWith('.ts');

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, FormEntity, FormResponseEntity, FolderEntity, FormMaterialEntity],
  migrations: [
    isTypeScriptRuntime
      ? join(process.cwd(), 'src/database/migrations/*.ts')
      : join(process.cwd(), 'dist/database/migrations/*.js'),
  ],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: false,
});
