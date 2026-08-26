import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TrackedSkuDto {
  @IsNotEmpty() @IsString() productId: string;
  @IsNotEmpty() @IsString() skuId: string;
  @IsOptional() @IsString() displayName?: string;
}

export class SaveGoogleWorkspaceConfigDto {
  @IsNotEmpty() @IsEmail() adminEmail: string;
  // Left blank on the settings form to keep the currently stored key --
  // see GoogleWorkspaceService.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() serviceAccountJson?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TrackedSkuDto) skus: TrackedSkuDto[];
}
