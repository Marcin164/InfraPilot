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

  // Loosely-typed PS-shaped blobs -- @IsArray()/@IsObject() only, no nested
  // shape validation. They MUST carry a decorator: the app's global
  // ValidationPipe runs with `whitelist: true`, which strips any property
  // of a @ValidateNested() class that has no validator at all -- a bare
  // `[key: string]: any` index signature is TS-only and does NOT exempt a
  // property from that stripping. Without these, cpu/ram/gpu/bios/disks
  // were silently deleted from every single scan before reaching the DB.
  @IsOptional() @IsArray() cpu?: unknown[];
  @IsOptional() @IsArray() ram_modules?: unknown[];
  @IsOptional() @IsArray() gpus?: unknown[];
  @IsOptional() @IsObject() bios?: Record<string, unknown>;
  @IsOptional() @IsArray() disks?: unknown[];

  [key: string]: any;
}

export class SystemSectionDto {
  @IsOptional() @IsString() @MaxLength(512) hostname?: string;
  @IsOptional() @IsString() @MaxLength(256) os_name?: string;
  @IsOptional() @IsString() @MaxLength(256) os_version?: string;

  // Same whitelist-stripping hazard as HardwareSectionDto above.
  @IsOptional() @IsString() @MaxLength(256) username?: string;
  @IsOptional() @IsString() @MaxLength(64) boot_time?: string;
  @IsOptional() @IsString() @MaxLength(64) machine?: string;
  @IsOptional() @IsObject() Cim?: Record<string, unknown>;

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
  /** Agent's best-effort guess ("Laptop" | "PC") from WMI chassis/battery
   *  data. Service layer validates against the real subgroup options
   *  before trusting it -- treat as a hint, not a guarantee. */
  @IsOptional() @IsString() @MaxLength(32) deviceType?: string;
}

