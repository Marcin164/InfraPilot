import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveDropboxConfigDto {
  @IsNotEmpty() @IsString() appKey: string;
  // Left blank on the settings form to keep the currently stored values --
  // see DropboxService.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() refreshToken?: string;
}
