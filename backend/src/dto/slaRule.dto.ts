import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TicketPriority } from 'src/entities/tickets.entity';
import { TicketType } from 'src/entities/slaRule.entity';

export class CreateSlaRuleDto {
  @IsEnum(TicketPriority) priority: TicketPriority;
  @IsNotEmpty() @IsString() definitionId: string;
  @IsOptional() @IsIn(Object.values(TicketType)) ticketType?: TicketType | null;
}

export class UpdateSlaRuleDto {
  @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @IsOptional() @IsIn(Object.values(TicketType)) ticketType?: TicketType | null;
  @IsOptional() @IsString() definitionId?: string;
}

export class SlaRuleMatrixEntryDto {
  @IsEnum(TicketPriority) priority: TicketPriority;
  @IsOptional() @IsIn(Object.values(TicketType)) ticketType?: TicketType | null;
  @IsNotEmpty() @IsString() definitionId: string;
}

export class ReplaceSlaRuleMatrixDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaRuleMatrixEntryDto)
  entries: SlaRuleMatrixEntryDto[];
}
