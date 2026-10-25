import { IsObject } from 'class-validator';

export interface UploadedAnswer {
  name: string;
  data: string;
}

export interface SubmittedField {
  label: string;
  type: string;
  value: string | number | boolean | null | UploadedAnswer | UploadedAnswer[];
}

export class CreateResponseDto {
  @IsObject()
  formData!: Record<string, SubmittedField>;
}
