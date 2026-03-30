import api from "../lib/api";
import type { UserSettings } from "../Types";

export const getUserSettings = async (): Promise<UserSettings> => {
  const { data } = await api.get("/settings");
  return data;
};

export const updateUserSettings = async (data: Partial<UserSettings>): Promise<UserSettings> => {
  const { data: result } = await api.patch("/settings", data);
  return result;
};
