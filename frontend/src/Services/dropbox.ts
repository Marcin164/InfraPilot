import api from "../lib/api";

export type DropboxPublicConfig = { appKey: string; hasSecret: boolean; hasRefreshToken: boolean };
export type DropboxConfig = { appKey: string; appSecret?: string; refreshToken?: string };

export type DropboxSyncStatus = { licensesLastSync: string | null };
export type DropboxLicenseSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };

export const getDropboxConfig = async (): Promise<DropboxPublicConfig> => {
  const { data } = await api.get("/dropbox/config");
  return data;
};

export const saveDropboxConfig = async (cfg: DropboxConfig): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/dropbox/config", cfg);
  return data;
};

export const deleteDropboxConfig = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/dropbox/config");
  return data;
};

export const testDropboxConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/dropbox/test");
  return data;
};

export const getDropboxSyncStatus = async (): Promise<DropboxSyncStatus> => {
  const { data } = await api.get("/dropbox/sync/status");
  return data;
};

export const syncDropboxLicenses = async (): Promise<DropboxLicenseSyncResult> => {
  const { data } = await api.post("/dropbox/sync/licenses");
  return data;
};
