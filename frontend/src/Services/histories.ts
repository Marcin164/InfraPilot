import api from "../lib/api";
import type { HistoryEntry, HistoryType } from "../Types";

export const createHistoryEntry = async (
  data: Record<string, unknown>,
): Promise<HistoryEntry> => {
  const { data: result } = await api.post("/histories/", data);
  return result;
};

export const getDeviceHistory = async (
  deviceId: string,
): Promise<HistoryEntry[]> => {
  const { data } = await api.get(`/histories/device/${deviceId}`);
  return data;
};

export const getUsersDevices = async (
  userId: string,
): Promise<HistoryEntry[]> => {
  const { data } = await api.get(`/histories/user/${userId}`);
  return data;
};

export interface HistoryFeedFilters {
  types?: HistoryType[];
  from?: string;
  to?: string;
  q?: string;
  deviceId?: string;
  userId?: string;
}

export interface HistoryFeedPage {
  data: HistoryEntry[];
  nextCursor: string | null;
}

export const getHistoryFeed = async (
  cursor: string | null,
  filters: HistoryFeedFilters,
  limit = 30,
): Promise<HistoryFeedPage> => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q) params.set("q", filters.q);
  if (filters.deviceId) params.set("deviceId", filters.deviceId);
  if (filters.userId) params.set("userId", filters.userId);
  (filters.types ?? []).forEach((t) => params.append("types", String(t)));

  const { data } = await api.get(`/histories/feed?${params.toString()}`);
  return data;
};

const buildFilterParams = (filters: HistoryFeedFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q) params.set("q", filters.q);
  if (filters.deviceId) params.set("deviceId", filters.deviceId);
  if (filters.userId) params.set("userId", filters.userId);
  (filters.types ?? []).forEach((t) => params.append("types", String(t)));
  return params;
};

export const exportHistoryFeedCsv = async (
  filters: HistoryFeedFilters,
): Promise<void> => {
  const params = buildFilterParams(filters);
  const res = await api.get(`/histories/feed/export?${params.toString()}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `history-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
