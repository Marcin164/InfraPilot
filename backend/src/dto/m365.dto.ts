import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveM365ConfigDto {
  @IsNotEmpty() @IsString() tenantId: string;
  @IsNotEmpty() @IsString() clientId: string;
  // Left blank on the settings form to keep the currently stored secret --
  // see M365Service.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() clientSecret?: string;
}

export class M365LicenseActionDto {
  @IsNotEmpty() @IsString() skuId: string;
}
