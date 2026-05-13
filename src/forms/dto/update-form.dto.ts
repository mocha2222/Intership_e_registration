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
} from 'class-validator';

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
  @IsBoolean()
  isPublished?: boolean;

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
  @IsString()
  @MaxLength(100)
  folderKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

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
  @IsIn(['public', 'private', 'company'])
  accessMode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['form', 'attendance'])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['submit_only', 'submit_and_view'])
  permissionMode?: string;

  // ── Attendance ──
  @IsOptional()
  @IsBoolean()
  attendanceEnabled?: boolean;

  // ── Submission Timing (ALL forms) ──
  @IsOptional()
  @IsString()
  submissionStartTime?: string | null;

  @IsOptional()
  @IsString()
  submissionEndTime?: string | null;

  // ── Attendance Timing (only when attendanceEnabled) ──
  @IsOptional()
  @IsString()
  eventStartTime?: string | null;

  @IsOptional()
  @IsString()
  eventEndTime?: string | null;

  @IsOptional()
  @IsString()
  attendanceCloseTime?: string | null;

  // ── Material Upload ──
  @IsOptional()
  @IsBoolean()
  materialUploadEnabled?: boolean;

  @IsOptional()
  @IsString()
  expirationDate?: string | null;

  @IsOptional()
  @IsString()
  expirationTime?: string | null;

  @IsOptional()
  @IsInt()
  submissionLimit?: number | null;
}
