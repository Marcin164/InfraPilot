import {
  IsOptional,
  IsEnum,
  IsIn,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TicketImpact,
  TicketPriority,
  TicketUrgency,
  TicketType,
  TicketState,
} from 'src/entities/tickets.entity';
import { CommentType } from 'src/entities/ticketsComments.entity';

// Multi-select filter checkboxes on the frontend always send these as
// arrays, but a single selection serializes to one bare query param
// (e.g. `priority=High`) instead of `priority[]=High` -- normalize both
// shapes to an array so `@IsEnum(..., { each: true })` can validate it.
const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? value : Array.isArray(value) ? value : [value];

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
  @Transform(toArray)
  @IsArray()
  @IsEnum(TicketType, { each: true })
  type?: TicketType[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(TicketPriority, { each: true })
  priority?: TicketPriority[];

  @IsOptional()
  assignmentGroup?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(TicketImpact, { each: true })
  impact?: TicketImpact[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(TicketUrgency, { each: true })
  urgency?: TicketUrgency[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(TicketState, { each: true })
  state?: TicketState[];

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

  // Sent by QuickActions.tsx's resolve()/reopen() and ClosureNotesForm.tsx --
  // reopen() explicitly sends `null` to clear a previous closure, so this
  // can't be tightened to a non-nullable string.
  @IsOptional()
  closureCode?: string | null;

  @IsOptional()
  @IsString()
  closureNotes?: string | null;
}

// Kept only for backward compatibility -- the service no-ops this endpoint
// (categories are managed via Workflows -> Categories now). Not called from
// anywhere in the frontend today, but still typed to match the shape the
// (unused) Services/tickets.ts helper would send -- an empty DTO would 400
// under forbidNonWhitelisted if this ever gets wired back up.
export class UpdateTicketCategoriesDto {
  @IsOptional() @IsArray() Incident?: unknown[];
  @IsOptional() @IsArray() Service?: unknown[];
}

export class LinkTicketDto {
  @IsOptional() @IsString() parentTicketId: string | null;
}

export class UpdateApprovalDto {
  @IsIn(['approved', 'rejected']) decision: 'approved' | 'rejected';
}

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType;
}

export class CreateTicketDto {
  @IsEnum(TicketType)
  type: TicketType;

  @IsString()
  description: string;

  @IsString()
  requesterId: string;

  @IsOptional()
  @IsString()
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
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsObject()
  customFieldValues?: Record<
    string,
    { label: string; type: string; value: unknown }
  >;
}
