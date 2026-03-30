import api from "../lib/api";
import type { HistoryEntry } from "../Types";

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
