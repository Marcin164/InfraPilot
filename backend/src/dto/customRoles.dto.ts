import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomRoleDto {
  @IsNotEmpty() @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() grantsAllPermissions?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}

export class UpdateCustomRoleDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() grantsAllPermissions?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}
