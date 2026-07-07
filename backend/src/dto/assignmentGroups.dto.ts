import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssignmentGroupDto {
  @IsNotEmpty() @IsString() @MaxLength(128) name: string;
  @IsOptional() @IsString() @MaxLength(512) description?: string;
}

export class UpdateAssignmentGroupDto {
  @IsOptional() @IsString() @MaxLength(128) name?: string;
  @IsOptional() @IsString() @MaxLength(512) description?: string;
}

export class SetGroupMembersDto {
  @IsArray() @IsString({ each: true }) userIds: string[];
}
