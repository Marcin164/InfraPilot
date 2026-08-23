export type SlaType = "RESPONSE" | "RESOLUTION";
export type EscalationActionType = "NOTIFY" | "REASSIGN" | "PRIORITY_UP";

export interface SlaCalendar {
  id: string;
  name: string;
  timezone: string;
  workingDays: number[];
  workStart?: string | null;
  workEnd?: string | null;
  holidays: SlaHoliday[];
}

export interface SlaHoliday {
  id?: string;
  date: string;
  description: string;
}

export interface SlaDefinition {
  id: string;
  name: string;
  // At least one of the two is set -- a single definition can carry both a
  // response and a resolution target sharing the same calendar.
  responseMinutes: number | null;
  resolutionMinutes: number | null;
  calendar?: { id: string; name: string };
  calendarId?: string;
}

export interface SlaRule {
  id: string;
  priority: string;
  ticketType: string | null;
  definitionId: string;
  slaDefinition?: { id: string; name: string };
}

export interface SlaEscalation {
  id: string;
  slaDefinitionId: string;
  triggerPercentage: number;
  // null = applies to both RESPONSE and RESOLUTION instances of the definition.
  appliesTo?: SlaType | null;
  actionType: EscalationActionType;
  actionConfig: {
    channel?: string;
    recipients?: string;
    targetPriority?: string;
    targetGroup?: string;
  };
}

export interface TicketSla {
  instances: SlaInstance[];
}

export interface SlaInstance {
  id: string;
  type: SlaType;
  name: string;
  status: "ACTIVE" | "PAUSED" | "BREACHED";
  remainingMinutes: number;
  usedPercentage: number;
  breached: boolean;
  paused: boolean;
  dueAt: string;
  targetMinutes: number;
}
