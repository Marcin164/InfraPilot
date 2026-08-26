import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveZoomConfigDto {
  @IsNotEmpty() @IsString() accountId: string;
  @IsNotEmpty() @IsString() clientId: string;
  // Left blank on the settings form to keep the currently stored secret --
  // see ZoomService.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() clientSecret?: string;
}
