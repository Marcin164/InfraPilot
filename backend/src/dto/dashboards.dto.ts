import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDashboardDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() userId: string;

  // Frontend's createDashboard() type allows this optionally, even though
  // no current call site sends it (createDashboard() service always
  // initializes cards: [] regardless) -- kept here so it doesn't 400 if a
  // future caller starts passing it.
  @IsOptional() @IsArray() cards?: Record<string, any>[];
}

export class UpdateDashboardCardsDto {
  // Free-form widget configs (type/position/size vary per card) -- validated
  // as an array only, same convention as the loosely-typed scan blobs in
  // devices.dto.ts. Must still carry a decorator or whitelist:true strips it.
  @IsArray()
  cards: Record<string, any>[];
}
