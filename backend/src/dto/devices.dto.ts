import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BaseboardDto {
  @IsOptional() @IsString() @MaxLength(256) serial_number?: string;
  @IsOptional() @IsString() @MaxLength(256) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(256) product?: string;
}

export class HardwareSectionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseboardDto)
  baseboard?: BaseboardDto;

  [key: string]: any;
}

export class SystemSectionDto {
  @IsOptional() @IsString() @MaxLength(512) hostname?: string;
  @IsOptional() @IsString() @MaxLength(256) os_name?: string;
  @IsOptional() @IsString() @MaxLength(256) os_version?: string;

  [key: string]: any;
}

export class DeviceScanDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SystemSectionDto)
  system?: SystemSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HardwareSectionDto)
  hardware?: HardwareSectionDto;

  @IsOptional() @IsObject() software?: Record<string, unknown>;
  @IsOptional() @IsObject() network?: Record<string, unknown>;
  @IsOptional() @IsObject() users_and_groups?: Record<string, unknown>;
  @IsOptional() @IsObject() security?: Record<string, unknown>;
  @IsOptional() @IsObject() peripherals?: Record<string, unknown>;
  @IsOptional() @IsObject() events?: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(256) serialNumber?: string;
}

/**
 * Fingerprint payload sent at agent self-enrollment. Every field is
 * optional individually, but the controller rejects requests where all
 * of {tpmFingerprint, macAddresses, cpuId, serialNumber} are empty —
 * without at least one stable identifier we cannot tell two hosts apart.
 */
export class AgentEnrollDto {
  @IsOptional() @IsString() @MaxLength(128) tpmFingerprint?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  macAddresses?: string[];

  @IsOptional() @IsString() @MaxLength(128) cpuId?: string;
  @IsOptional() @IsString() @MaxLength(256) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(512) hostname?: string;
  @IsOptional() @IsString() @MaxLength(256) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(256) model?: string;
  @IsOptional() @IsString() @MaxLength(64) agentVersion?: string;
  @IsOptional() @IsString() @MaxLength(32) platform?: string;
}

