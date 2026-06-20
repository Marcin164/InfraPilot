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
  type: SlaType;
  targetMinutes: number;
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
