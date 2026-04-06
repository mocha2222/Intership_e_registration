import { Module } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormResponseEntity } from '../entities/form-response.entity';
import { FormEntity } from '../entities/form.entity';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormResponseEntity, FormEntity]),
    AttendanceModule, // Provides AttendanceService for QR token generation
  ],
  providers: [ResponsesService],
  controllers: [ResponsesController],
})
export class ResponsesModule {}
