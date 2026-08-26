import api from "../lib/api";

export type GithubPublicConfig = { enterpriseSlug: string; hasToken: boolean };
export type GithubConfig = { enterpriseSlug: string; token?: string };

export type GithubSyncStatus = { licensesLastSync: string | null };
export type GithubLicenseSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };

export const getGithubConfig = async (): Promise<GithubPublicConfig> => {
  const { data } = await api.get("/github/config");
  return data;
};

export const saveGithubConfig = async (cfg: GithubConfig): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/github/config", cfg);
  return data;
};

export const deleteGithubConfig = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/github/config");
  return data;
};

export const testGithubConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/github/test");
  return data;
};

export const getGithubSyncStatus = async (): Promise<GithubSyncStatus> => {
  const { data } = await api.get("/github/sync/status");
  return data;
};

export const syncGithubLicenses = async (): Promise<GithubLicenseSyncResult> => {
  const { data } = await api.post("/github/sync/licenses");
  return data;
};
