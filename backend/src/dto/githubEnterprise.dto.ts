import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveGithubConfigDto {
  @IsNotEmpty() @IsString() enterpriseSlug: string;
  // Left blank on the settings form to keep the currently stored token --
  // see GithubEnterpriseService.saveConfig, which falls back to the existing value.
  @IsOptional() @IsString() token?: string;
}
