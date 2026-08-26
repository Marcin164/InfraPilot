import api from "../lib/api";

export type ZoomPublicConfig = { accountId: string; clientId: string; hasSecret: boolean };
export type ZoomConfig = { accountId: string; clientId: string; clientSecret?: string };

export type ZoomSyncStatus = { licensesLastSync: string | null };
export type ZoomLicenseSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };

export const getZoomConfig = async (): Promise<ZoomPublicConfig> => {
  const { data } = await api.get("/zoom/config");
  return data;
};

export const saveZoomConfig = async (cfg: ZoomConfig): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/zoom/config", cfg);
  return data;
};

export const deleteZoomConfig = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/zoom/config");
  return data;
};

export const testZoomConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/zoom/test");
  return data;
};

export const getZoomSyncStatus = async (): Promise<ZoomSyncStatus> => {
  const { data } = await api.get("/zoom/sync/status");
  return data;
};

export const syncZoomLicenses = async (): Promise<ZoomLicenseSyncResult> => {
  const { data } = await api.post("/zoom/sync/licenses");
  return data;
};
