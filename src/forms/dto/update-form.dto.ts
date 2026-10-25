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
import { FormSettingsDto, FormAttendanceDto } from './create-form.dto';

export class UpdateFormDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

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
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['form', 'attendance'])
  type?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormSettingsDto)
  settings?: FormSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormAttendanceDto)
  attendance?: FormAttendanceDto;
}
