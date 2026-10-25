import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FormSettingsDto {
  @IsOptional()
  @IsString()
  submissionStartTime?: string;

  @IsOptional()
  @IsString()
  submissionEndTime?: string;

  @IsOptional()
  @IsString()
  @IsIn(['submit_only', 'submit_and_view'])
  permissionMode?: string;

  @IsOptional()
  @IsBoolean()
  materialUploadEnabled?: boolean;

  @IsOptional()
  @IsString()
  expirationAt?: string;

  @IsOptional()
  @IsInt()
  submissionLimit?: number;
}

export class FormAttendanceDto {
  @IsOptional()
  @IsBoolean()
  attendanceEnabled?: boolean;

  @IsOptional()
  @IsString()
  eventStartTime?: string;

  @IsOptional()
  @IsString()
  eventEndTime?: string;

  @IsOptional()
  @IsString()
  attendanceCloseTime?: string;
}

export class CreateFormDto {
  @IsString()
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @IsIn(['form', 'attendance'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  schema?: Record<string, any>;

  @IsOptional()
  @IsString()
  @IsIn([
    'enabled',
    'disabled',
    'disable_date',
    'disable_limit',
    'disable_both',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  layoutType?: string;

  @IsOptional()
  @IsInt()
  folderId?: number;

  @IsOptional()
  @IsArray()
  pages?: any[];

  @IsOptional()
  @IsInt()
  @Min(1)
  nextElementId?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsObject()
  design?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormSettingsDto)
  settings?: FormSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormAttendanceDto)
  attendance?: FormAttendanceDto;
}
