import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormEntity } from '../entities/form.entity';
import { FormSettingEntity } from '../entities/form-setting.entity';
import { FormAttendanceEntity } from '../entities/form-attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FormEntity, FormSettingEntity, FormAttendanceEntity])],
  providers: [FormsService],
  controllers: [FormsController],
  exports: [FormsService],
})
export class FormsModule {}
