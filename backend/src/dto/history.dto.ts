import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() justification?: string;
  @IsOptional() @IsString() ticket?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() deviceId?: string;
  @IsOptional() @IsInt() type?: number;
  @IsOptional() @IsString() agent?: string;
  @IsOptional() @IsBoolean() isUserFault?: boolean;
  @IsOptional() @IsString() fixes?: string;
  @IsOptional() @IsString() damages?: string;

  // Only present/used when type === 3 (component swap) -- see
  // HistoriesService.createHistory.
  @IsOptional() @IsArray() removedComponents?: { deviceId: string }[];
  @IsOptional() @IsArray() @IsString({ each: true }) addedComponents?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) approvers?: string[];
}
