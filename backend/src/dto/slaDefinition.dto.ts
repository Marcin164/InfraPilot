import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSlaDefinitionDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() calendarId: string;
  @IsOptional() @IsInt() @Min(1) responseMinutes?: number;
  @IsOptional() @IsInt() @Min(1) resolutionMinutes?: number;
}

export class UpdateSlaDefinitionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() calendarId?: string;
  @IsOptional() @IsInt() @Min(1) responseMinutes?: number;
  @IsOptional() @IsInt() @Min(1) resolutionMinutes?: number;
}
