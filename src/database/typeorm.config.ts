import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { FormEntity } from '../entities/form.entity';
import { FormResponseEntity } from '../entities/form-response.entity';
import { UserEntity } from '../entities/user.entity';
import { FolderEntity } from '../entities/folder.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { FormMaterialEntity } from '../entities/form-material.entity';
import { OtpEntity } from '../entities/otp.entity';

export function typeormConfig(
  config: ConfigService,
): TypeOrmModuleOptions & { autoLoadEntities: boolean } {
  return {
    type: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.get<string>('DB_PORT') ?? 3306),
    username: config.getOrThrow<string>('DB_USERNAME'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_DATABASE'),
    entities: [UserEntity, FormEntity, FormResponseEntity, FolderEntity, AttendanceEntity, FormMaterialEntity, OtpEntity],
    autoLoadEntities: false,
    synchronize: false,
    migrationsRun: true,
    // App runtime should only ever read compiled migrations.
    migrations: [join(process.cwd(), 'dist/database/migrations/*.js')],
    logging: config.get<string>('DB_LOGGING') === 'true',
    charset: 'utf8mb4',
  };
}
