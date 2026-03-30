import api from "../lib/api";

interface AgentSettings {
  id: string;
  enabled: boolean;
  interval: number;
  [key: string]: unknown;
}

export const getSettings = async (): Promise<AgentSettings> => {
  const { data } = await api.get("/agent/settings");
  return data;
};
