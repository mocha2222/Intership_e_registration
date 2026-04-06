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
  @IsString()
  @IsIn(['public', 'private', 'company'])
  accessMode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['submit_only', 'submit_and_view'])
  permissionMode?: string;
}
