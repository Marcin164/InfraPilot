import api from "../lib/api";

export type TrackedProfile = { groupName: string; displayName?: string };

export type AdobePublicConfig = {
  orgId: string;
  clientId: string;
  hasSecret: boolean;
  profiles: TrackedProfile[];
};

export type AdobeConfig = {
  orgId: string;
  clientId: string;
  clientSecret?: string;
  profiles: TrackedProfile[];
};

export type AdobeSyncStatus = { licensesLastSync: string | null };
export type AdobeLicenseSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };

export const getAdobeConfig = async (): Promise<AdobePublicConfig> => {
  const { data } = await api.get("/adobe/config");
  return data;
};

export const saveAdobeConfig = async (cfg: AdobeConfig): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/adobe/config", cfg);
  return data;
};

export const deleteAdobeConfig = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/adobe/config");
  return data;
};

export const testAdobeConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/adobe/test");
  return data;
};

export const getAdobeSyncStatus = async (): Promise<AdobeSyncStatus> => {
  const { data } = await api.get("/adobe/sync/status");
  return data;
};

export const syncAdobeLicenses = async (): Promise<AdobeLicenseSyncResult> => {
  const { data } = await api.post("/adobe/sync/licenses");
  return data;
};
