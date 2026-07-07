import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class SaveSmtpConfigDto {
  @IsNotEmpty() @IsString() host: string;
  @IsInt() @Min(1) @Max(65535) port: number;
  @IsBoolean() secure: boolean;
  @IsNotEmpty() @IsString() user: string;
  // Left blank on the settings form to keep the currently stored password --
  // see SmtpSettingsService.saveConfig.
  @IsOptional() @IsString() pass?: string;
  @IsNotEmpty() @IsString() from: string;
}
