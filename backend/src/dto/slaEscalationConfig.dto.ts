import { IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

const ESCALATION_ACTION_TYPES = ['NOTIFY', 'REASSIGN', 'PRIORITY_UP'] as const;

export class CreateEscalationConfigDto {
  @IsNotEmpty() @IsString() slaDefinitionId: string;
  @IsInt() @Min(1) @Max(100) triggerPercentage: number;
  @IsIn(ESCALATION_ACTION_TYPES) actionType: (typeof ESCALATION_ACTION_TYPES)[number];
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;
}

export class UpdateEscalationConfigDto {
  @IsOptional() @IsString() slaDefinitionId?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) triggerPercentage?: number;
  @IsOptional() @IsIn(ESCALATION_ACTION_TYPES) actionType?: (typeof ESCALATION_ACTION_TYPES)[number];
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;

  // EditEscalationForm.tsx's edit branch spreads the whole loaded
  // SlaEscalation object back into the PATCH body (incl. id) -- not read by
  // the service, accepted here so the request doesn't 400.
  @IsOptional() @IsString() id?: string;
}
