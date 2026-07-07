import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeviceLifecycle } from 'src/entities/devices.entity';

export class CreateEnrollmentTokenDto {
  @IsOptional() @IsString() @MaxLength(200)
  label?: string;

  @IsOptional() @IsInt() @Min(1) @Max(24 * 7)
  ttlHours?: number;
}

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

export class AddDeviceDto {
  @IsOptional() @IsString() @MaxLength(64) group?: string;
  @IsOptional() @IsString() @MaxLength(64) subgroup?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() @MaxLength(256) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(256) assetName?: string;
  @IsOptional() @IsString() @MaxLength(256) model?: string;
  @IsOptional() @IsString() @MaxLength(256) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(256) location?: string;
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @IsString() @MaxLength(64) managementIp?: string;
  @IsOptional() portCount?: number | string;
  @IsOptional() @IsString() @MaxLength(64) firmwareVersion?: string;
  @IsOptional() @IsString() @MaxLength(32) macAddress?: string;
}

export class BulkImportDeviceRowDto {
  @IsOptional() @IsString() @MaxLength(256) assetName?: string;
  @IsOptional() @IsString() @MaxLength(256) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(64) group?: string;
  @IsOptional() @IsString() @MaxLength(64) subgroup?: string;
  @IsOptional() @IsString() @MaxLength(256) model?: string;
  @IsOptional() @IsString() @MaxLength(256) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(256) location?: string;
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @IsString() @MaxLength(32) lifecycle?: string;
  @IsOptional() @IsString() @MaxLength(32) purchaseDate?: string;
  @IsOptional() @IsString() @MaxLength(32) purchasePrice?: string;
  @IsOptional() @IsString() @MaxLength(8) purchaseCurrency?: string;
  @IsOptional() @IsString() @MaxLength(128) vendor?: string;
  @IsOptional() @IsString() @MaxLength(32) warrantyEnd?: string;
}

export class BulkImportDevicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportDeviceRowDto)
  rows: BulkImportDeviceRowDto[];
}

export class AssignDeviceDto {
  @IsNotEmpty() @IsString() deviceId: string;
  @IsNotEmpty() @IsString() userId: string;
}

export class CreateDeviceTagDto {
  @IsNotEmpty() @IsString() @MaxLength(64) key: string;
  @IsNotEmpty() @IsString() @MaxLength(128) label: string;
  @IsOptional() @IsString() @MaxLength(16) color?: string;
  @IsOptional() @IsString() @MaxLength(512) description?: string;
}

export class MergeDevicesDto {
  @IsNotEmpty() @IsString() sourceDeviceId: string;
}

export class StartRemoteSessionDto {
  @IsOptional() @IsString() ticketId?: string | null;
}

export class UpdateDeviceLifecycleDto {
  @IsOptional() @IsEnum(DeviceLifecycle) lifecycle?: DeviceLifecycle;
  @IsOptional() @IsString() lifecycleNote?: string;
  @IsOptional() @IsString() purchaseDate?: string;
  @IsOptional() @IsString() purchasePrice?: string;
  @IsOptional() @IsString() @MaxLength(8) purchaseCurrency?: string;
  @IsOptional() @IsString() @MaxLength(128) vendor?: string;
  @IsOptional() @IsString() @MaxLength(128) purchaseOrder?: string;
  @IsOptional() @IsString() warrantyStart?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsInt() depreciationYears?: number;
  @IsOptional() @IsString() retiredAt?: string;
  @IsOptional() @IsString() disposedAt?: string;
  @IsOptional() @IsString() @MaxLength(128) disposalMethod?: string;
  @IsOptional() @IsString() locationId?: string;
}

export class UpdateDeviceDetailsDto {
  @IsOptional() @IsString() @MaxLength(256) assetName?: string;
  @IsOptional() @IsString() @MaxLength(256) model?: string;
  @IsOptional() @IsString() @MaxLength(256) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(256) serialNumber?: string;
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @IsString() @MaxLength(64) managementIp?: string;
  @IsOptional() @IsInt() portCount?: number;
  @IsOptional() @IsString() @MaxLength(64) firmwareVersion?: string;
  @IsOptional() @IsString() @MaxLength(32) macAddress?: string;
}

export class BulkTagActionDto {
  @IsArray() @IsString({ each: true }) deviceIds: string[];
  @IsArray() @IsString({ each: true }) tagIds: string[];
  @IsIn(['attach', 'detach']) action: 'attach' | 'detach';
}

export class BulkAssignDto {
  @IsArray() @IsString({ each: true }) deviceIds: string[];
  @IsOptional() @IsString() userId: string | null;
}

export class BulkLifecycleDto {
  @IsArray() @IsString({ each: true }) deviceIds: string[];
  @IsEnum(DeviceLifecycle) lifecycle: DeviceLifecycle;
  @IsOptional() @IsString() note?: string;
}

const AGENT_TASK_TYPES = ['scan_now', 'collect_event_log', 'inventory_refresh'] as const;

export class EnqueueBulkTasksDto {
  @IsArray() @IsString({ each: true }) deviceIds: string[];
  @IsIn(AGENT_TASK_TYPES) type: (typeof AGENT_TASK_TYPES)[number];
  @IsOptional() @IsObject() payload?: Record<string, any>;
}

export class EnqueueTaskDto {
  @IsIn(AGENT_TASK_TYPES) type: (typeof AGENT_TASK_TYPES)[number];
  @IsOptional() @IsObject() payload?: Record<string, any>;
}

export class ClaimTasksDto {
  @IsOptional() @IsInt() @Min(1) @Max(50) max?: number;
}

export class CompleteTaskDto {
  @IsNotEmpty() @IsString() leaseToken: string;
  @IsOptional() @IsObject() result?: Record<string, any>;
}

export class FailTaskDto {
  @IsNotEmpty() @IsString() leaseToken: string;
  @IsOptional() @IsString() error?: string;
}

