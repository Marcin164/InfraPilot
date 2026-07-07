import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from 'src/entities/tickets.entity';
import { TicketType } from 'src/entities/slaRule.entity';

export class CreateSlaRuleDto {
  @IsEnum(TicketPriority) priority: TicketPriority;
  @IsNotEmpty() @IsString() definitionId: string;
  @IsOptional() @IsIn(Object.values(TicketType)) ticketType?: TicketType | null;

  // create() is only ever called from EditRuleForm.tsx's "new rule" branch,
  // whose defaultValues also include this field -- accepted and ignored,
  // not read by the service.
  @IsOptional() @IsString() id?: string;
}

export class UpdateSlaRuleDto {
  @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @IsOptional() @IsIn(Object.values(TicketType)) ticketType?: TicketType | null;
  @IsOptional() @IsString() definitionId?: string;

  // EditRuleForm.tsx's edit branch spreads the whole loaded SlaRule object
  // (including these two) back into the PATCH body -- accepted and ignored.
  @IsOptional() @IsString() id?: string;
  @IsOptional() slaDefinition?: { id: string; name: string };
}
