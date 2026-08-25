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
  @IsString()
  @IsIn(['submit_only', 'submit_and_view'])
  permissionMode?: string;

  @IsOptional()
  @IsString()
  expirationAt?: string;
}
