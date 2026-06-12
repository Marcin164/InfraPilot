import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TicketImpact,
  TicketPriority,
  TicketUrgency,
  TicketType,
} from 'src/entities/tickets.entity';

export class GetTicketsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 30;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  assignee?: string;

  @IsOptional()
  requester?: string;

  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  assignmentGroup?: string;

  @IsOptional()
  @IsEnum(TicketImpact)
  impact?: TicketImpact;

  @IsOptional()
  @IsEnum(TicketUrgency)
  urgency?: TicketUrgency;

  // 🔥 DODAJ TO
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  current?: boolean;
}

export class UpdateTicketDto {
  @IsOptional()
  assignee?: string;

  @IsOptional()
  assignmentGroup?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketImpact)
  impact?: TicketImpact;

  @IsOptional()
  @IsEnum(TicketUrgency)
  urgency?: TicketUrgency;

  @IsOptional()
  category?: string;

  @IsOptional()
  state?: any;

  @IsOptional()
  resolvedAt?: Date;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTicketDto {
  type: TicketType;
  description: string;
  requesterId: string;
  assignmentGroup: string;
  priority?: TicketPriority;
  impact?: TicketImpact;
  urgency?: TicketUrgency;
  category?: string;
  deviceId?: string;
}
