import api from "../lib/api";

export type NotificationType =
  | "mention"
  | "assignment"
  | "sla_breach"
  | "auto_followup"
  | "cve_critical"
  | "system";

export type Notification = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  entityType: string | null;
  entityId: string | null;
  actorId: string | null;
  readAt: string | null;
  createdAt: string;
};

export const listNotifications = async (
  unreadOnly = false,
  limit = 50,
): Promise<Notification[]> => {
  const { data } = await api.get("/notifications", {
    params: { unreadOnly: unreadOnly ? "true" : undefined, limit },
  });
  return data;
};

export const unreadNotificationCount = async (): Promise<number> => {
  const { data } = await api.get("/notifications/unread-count");
  return data.count ?? 0;
};

export const markNotificationsRead = async (
  ids: string[],
): Promise<{ affected: number }> => {
  const { data } = await api.post("/notifications/read", { ids });
  return data;
};

export const markAllNotificationsRead = async (): Promise<{
  affected: number;
}> => {
  const { data } = await api.post("/notifications/read-all");
  return data;
};
