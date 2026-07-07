import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { SlaType } from 'src/entities/slaDefinition.entity';

export class CreateSlaDefinitionDto {
  @IsNotEmpty() @IsString() name: string;
  @IsInt() @Min(1) targetMinutes: number;
  @IsNotEmpty() @IsString() calendarId: string;

  // EditDefinitionForm.tsx's defaultValues include `type` even on the
  // "create" branch -- SlaDefinitionService.create() doesn't read it
  // (SLA type is set separately), accepted here so the request doesn't 400.
  @IsOptional() @IsEnum(SlaType) type?: SlaType;
}

export class UpdateSlaDefinitionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) targetMinutes?: number;
  @IsOptional() @IsString() calendarId?: string;
  @IsOptional() @IsEnum(SlaType) type?: SlaType;

  // EditDefinitionForm.tsx's edit branch spreads the whole loaded
  // SlaDefinition object back into the PATCH body (incl. id and the nested
  // `calendar` relation object) -- neither is read by the service.
  @IsOptional() @IsString() id?: string;
  @IsOptional() calendar?: { id: string; name: string };
}
