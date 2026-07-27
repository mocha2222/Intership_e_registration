import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GenerateQrDto {
  @IsNotEmpty()
  @IsDateString()
  attendanceStartAt!: string;

  @IsNotEmpty()
  @IsDateString()
  attendanceEndAt!: string;
}

export class CheckinDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class ManualPhoneCheckinDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;
}
