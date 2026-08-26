import api from "../lib/api";

export type TrackedSku = { productId: string; skuId: string; displayName?: string };

export type GoogleWorkspacePublicConfig = {
  adminEmail: string;
  hasServiceAccount: boolean;
  skus: TrackedSku[];
};

export type GoogleWorkspaceConfig = {
  adminEmail: string;
  serviceAccountJson?: string;
  skus: TrackedSku[];
};

export type GoogleSyncStatus = { licensesLastSync: string | null };
export type GoogleLicenseSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };

export const getGoogleWorkspaceConfig = async (): Promise<GoogleWorkspacePublicConfig> => {
  const { data } = await api.get("/google-workspace/config");
  return data;
};

export const saveGoogleWorkspaceConfig = async (
  cfg: GoogleWorkspaceConfig,
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/google-workspace/config", cfg);
  return data;
};

export const deleteGoogleWorkspaceConfig = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/google-workspace/config");
  return data;
};

export const testGoogleWorkspaceConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/google-workspace/test");
  return data;
};

export const getGoogleWorkspaceSyncStatus = async (): Promise<GoogleSyncStatus> => {
  const { data } = await api.get("/google-workspace/sync/status");
  return data;
};

export const syncGoogleWorkspaceLicenses = async (): Promise<GoogleLicenseSyncResult> => {
  const { data } = await api.post("/google-workspace/sync/licenses");
  return data;
};
