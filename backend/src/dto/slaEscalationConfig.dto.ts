import { IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { SlaType } from 'src/entities/slaType.enum';

const ESCALATION_ACTION_TYPES = ['NOTIFY', 'REASSIGN', 'PRIORITY_UP'] as const;

export class CreateEscalationConfigDto {
  @IsNotEmpty() @IsString() slaDefinitionId: string;
  @IsInt() @Min(1) @Max(100) triggerPercentage: number;
  @IsIn(ESCALATION_ACTION_TYPES) actionType: (typeof ESCALATION_ACTION_TYPES)[number];
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;
  // null/omitted = applies to both RESPONSE and RESOLUTION instances of the definition.
  @IsOptional() @IsEnum(SlaType) appliesTo?: SlaType | null;
}

export class UpdateEscalationConfigDto {
  @IsOptional() @IsString() slaDefinitionId?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) triggerPercentage?: number;
  @IsOptional() @IsIn(ESCALATION_ACTION_TYPES) actionType?: (typeof ESCALATION_ACTION_TYPES)[number];
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;
  @IsOptional() @IsEnum(SlaType) appliesTo?: SlaType | null;
}
