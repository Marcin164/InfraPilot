import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLegalHoldDto {
  @IsNotEmpty() @IsString() userId: string;
  @IsNotEmpty() @IsString() reason: string;
  @IsOptional() @IsString() legalBasis?: string;
  @IsOptional() @IsString() retainUntil?: string;
}

export class ReleaseLegalHoldDto {
  @IsNotEmpty() @IsString() releasedReason: string;
}
