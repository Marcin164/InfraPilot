import { IsOptional, IsString, IsInt, Min, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() surname?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() office?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() assetName?: string;

  @IsOptional() @IsBoolean() enabled?: boolean;

  @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @Type(() => Number) @IsInt() @Min(1) limit: number = 20;
}

// Deliberately excludes id/distinguishedName/authUserId/role flags
// (isAdmin/isApprover/...) and Entra/AD-managed fields (entraId,
// erasedAt, memberOf, ...) -- those aren't part of the manual "add a
// user" form and shouldn't be settable through this endpoint even
// though it's already Admin-gated.
export class CreateUserDto {
  @IsOptional() @IsString() @MaxLength(128) name?: string;
  @IsOptional() @IsString() @MaxLength(128) surname?: string;
  @IsOptional() @IsString() @MaxLength(128) username?: string;
  @IsOptional() @IsString() @MaxLength(256) email?: string;
  @IsOptional() @IsString() @MaxLength(256) phone?: string;
  @IsOptional() @IsString() @MaxLength(128) title?: string;
  @IsOptional() @IsString() @MaxLength(128) department?: string;
  @IsOptional() @IsString() @MaxLength(128) company?: string;
  @IsOptional() @IsString() @MaxLength(128) office?: string;
  @IsOptional() @IsString() @MaxLength(256) streetAddress?: string;
  @IsOptional() @IsString() @MaxLength(128) city?: string;
  @IsOptional() @IsString() @MaxLength(32) postalCode?: string;
  @IsOptional() @IsString() @MaxLength(128) country?: string;
  @IsOptional() @IsString() manager?: string;
}

export class InsertManyUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}

export class BulkImportUserRowDto {
  @IsOptional() @IsString() @MaxLength(128) name?: string;
  @IsOptional() @IsString() @MaxLength(128) surname?: string;
  @IsOptional() @IsString() @MaxLength(256) email?: string;
  @IsOptional() @IsString() @MaxLength(256) phone?: string;
  @IsOptional() @IsString() @MaxLength(128) department?: string;
  @IsOptional() @IsString() @MaxLength(128) title?: string;
  @IsOptional() @IsString() @MaxLength(128) location?: string;
}

export class BulkImportUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportUserRowDto)
  rows: BulkImportUserRowDto[];
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(128) name?: string;
  @IsOptional() @IsString() @MaxLength(128) surname?: string;
  @IsOptional() @IsString() @MaxLength(128) username?: string;
  @IsOptional() @IsString() @MaxLength(256) email?: string;
  @IsOptional() @IsString() @MaxLength(256) phone?: string;
  @IsOptional() @IsString() @MaxLength(128) title?: string;
  @IsOptional() @IsString() @MaxLength(128) department?: string;
  @IsOptional() @IsString() @MaxLength(128) company?: string;
  @IsOptional() @IsString() @MaxLength(128) office?: string;
  @IsOptional() @IsString() @MaxLength(256) streetAddress?: string;
  @IsOptional() @IsString() @MaxLength(128) city?: string;
  @IsOptional() @IsString() @MaxLength(32) postalCode?: string;
  @IsOptional() @IsString() @MaxLength(128) country?: string;
  @IsOptional() @IsString() manager?: string;
  @IsOptional() @IsBoolean() isApprover?: boolean;
  @IsOptional() @IsBoolean() isAdmin?: boolean;
  @IsOptional() @IsBoolean() isAuditor?: boolean;
  @IsOptional() @IsBoolean() isCompliance?: boolean;
  @IsOptional() @IsBoolean() isHelpdesk?: boolean;
  @IsOptional() @IsBoolean() isDpo?: boolean;
  @IsOptional() @IsBoolean() isVip?: boolean;
}
