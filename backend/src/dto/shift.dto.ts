import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShiftDto {
  @IsNotEmpty() @IsString() userId: string;
  @IsNotEmpty() @IsString() type: string;
  @IsNotEmpty() @IsDateString() startDate: string;
  @IsNotEmpty() @IsDateString() endDate: string;
}

export class UpdateShiftDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() comment?: string | null;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
