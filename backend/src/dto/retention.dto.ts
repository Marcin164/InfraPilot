import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

const RETENTION_ACTIONS = ['archive', 'purge'] as const;

export class CreateRetentionPolicyDto {
  @IsNotEmpty() @IsString() entityType: string;
  @IsInt() @Min(1) retentionDays: number;
  @IsOptional() @IsIn(RETENTION_ACTIONS) action?: (typeof RETENTION_ACTIONS)[number];
  @IsOptional() @IsBoolean() enabled?: boolean;
}

export class UpdateRetentionPolicyDto {
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsInt() @Min(1) retentionDays?: number;
  @IsOptional() @IsIn(RETENTION_ACTIONS) action?: (typeof RETENTION_ACTIONS)[number];
  @IsOptional() @IsBoolean() enabled?: boolean;
}
