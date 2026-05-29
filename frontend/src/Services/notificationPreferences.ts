import api from "../lib/api";

export type NotificationEvent =
  | "ticket_assigned"
  | "ticket_state_changed"
  | "ticket_comment"
  | "ticket_mention"
  | "ticket_sla_breach"
  | "ticket_auto_followup"
  | "cve_critical"
  | "scan_completed"
  | "compliance_failing"
  | "workflow_step_failed";

export type NotificationChannel = "inapp" | "email" | "sms";

export type PreferenceRow = {
  event: NotificationEvent;
  channel: NotificationChannel;
  enabled: boolean;
};

export const listNotificationPreferences = async (): Promise<
  PreferenceRow[]
> => {
  const { data } = await api.get("/notification-preferences");
  return data;
};

export const updateNotificationPreferences = async (
  rows: PreferenceRow[],
): Promise<{ written: number }> => {
  const { data } = await api.post("/notification-preferences", { rows });
  return data;
};

export type TestResult = {
  inapp: boolean;
  email: boolean;
  emailAddress: string | null;
  sms: boolean;
  phone: string | null;
};

export const testNotification = async (): Promise<TestResult> => {
  const { data } = await api.post("/notification-preferences/test");
  return data;
};

export const EVENT_LABELS: Record<NotificationEvent, string> = {
  ticket_assigned: "Ticket assigned to me",
  ticket_state_changed: "Ticket state changed",
  ticket_comment: "New ticket comment",
  ticket_mention: "Mentioned in a ticket",
  ticket_sla_breach: "SLA breach",
  ticket_auto_followup: "Auto follow-up sent",
  cve_critical: "Critical CVE detected",
  scan_completed: "Device scan completed",
  compliance_failing: "Compliance check failing",
  workflow_step_failed: "Workflow step failed",
};
