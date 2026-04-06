import { IsEmail, IsObject, IsOptional } from 'class-validator';

export class CreateResponseDto {
  @IsOptional()
  @IsEmail()
  respondentEmail?: string;

  @IsObject()
  answers!: Record<string, any>;
}
