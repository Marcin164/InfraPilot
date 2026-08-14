import api from "../lib/api";
import type { NotificationEvent } from "./notificationPreferences";

export type OpsEventChannels = { inapp: boolean; email: boolean };

export type OpsNotificationConfig = {
  emails: string[];
  channels: Record<NotificationEvent, OpsEventChannels>;
};

export const getOpsNotificationConfig = async (): Promise<OpsNotificationConfig> => {
  const { data } = await api.get("/ops-notifications/config");
  return data;
};

export const saveOpsNotificationConfig = async (
  config: OpsNotificationConfig,
): Promise<void> => {
  await api.post("/ops-notifications/config", config);
};
