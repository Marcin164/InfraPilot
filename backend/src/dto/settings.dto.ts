import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() startPage?: string;
  @IsOptional() @IsString() dateFormat?: string;
  @IsOptional() @IsString() timeFormat?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(5) @Max(500) defaultPageSize?: number;
  @IsOptional() @IsBoolean() compactMode?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true }) usersTableColumnOrder?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) devicesTableColumnOrder?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) ticketsTableColumnOrder?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) licensesTableColumnOrder?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) procurementTableColumnOrder?: string[];

  @IsOptional() @IsString() reportsLayout?: string;

  // Loosely-typed blobs -- @IsArray()/@IsObject() only, no nested shape
  // validation, same convention as devices.dto.ts's scan sections. Must
  // still carry a decorator or whitelist:true silently strips them.
  @IsOptional() @IsArray() lastLogonThresholds?: Array<{
    maxDays: number;
    color: string;
    label: string;
  }>;

  @IsOptional() @IsString() lastLogonDefaultColor?: string;
  @IsOptional() @IsString() notifEmail?: string | null;
  @IsOptional() @IsString() notifPhone?: string | null;

  @IsOptional() @IsObject() filterPresets?: Record<
    string,
    Array<{ id: string; name: string; filters: Record<string, any>; lastUsed?: boolean }>
  >;
}
