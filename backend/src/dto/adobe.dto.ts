import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TrackedProfileDto {
  @IsNotEmpty() @IsString() groupName: string;
  @IsOptional() @IsString() displayName?: string;
}

export class SaveAdobeConfigDto {
  @IsNotEmpty() @IsString() orgId: string;
  @IsNotEmpty() @IsString() clientId: string;
  // Left blank on the settings form to keep the currently stored secret --
  // see AdobeService.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() clientSecret?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TrackedProfileDto) profiles: TrackedProfileDto[];
}
