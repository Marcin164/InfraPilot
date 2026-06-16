import api from "../lib/api";

export type M365PublicConfig = { tenantId: string; clientId: string; hasSecret: boolean };
export type M365Config = { tenantId: string; clientId: string; clientSecret?: string };

export type SubscribedSku = {
  id: string; skuId: string; skuPartNumber: string; capabilityStatus: string;
  consumedUnits: number; prepaidUnits: { enabled: number; warning: number; suspended: number };
};

export type M365User = {
  id: string; displayName: string; mail: string | null;
  userPrincipalName: string; assignedLicenses: { skuId: string }[];
};

export type SyncStatus = { usersLastSync: string | null; devicesLastSync: string | null };
export type UserSyncResult = { synced: number; created: number; skipped: number; lastSyncAt: string };
export type DeviceSyncResult = { synced: number; unmatched: number; lastSyncAt: string };

export const getM365Config = async (): Promise<M365PublicConfig> => {
  const { data } = await api.get("/m365/config");
  return data;
};

export const saveM365Config = async (cfg: M365Config): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/m365/config", cfg);
  return data;
};

export const deleteM365Config = async (): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete("/m365/config");
  return data;
};

export const testM365Connection = async (): Promise<{ ok: boolean; message: string }> => {
  const { data } = await api.post("/m365/test");
  return data;
};

export const getM365Skus = async (): Promise<SubscribedSku[]> => {
  const { data } = await api.get("/m365/skus");
  return data;
};

export const getM365Users = async (): Promise<M365User[]> => {
  const { data } = await api.get("/m365/users");
  return data;
};

export const assignM365License = async (userId: string, skuId: string): Promise<void> => {
  await api.post(`/m365/users/${userId}/assign`, { skuId });
};

export const removeM365License = async (userId: string, skuId: string): Promise<void> => {
  await api.post(`/m365/users/${userId}/remove`, { skuId });
};

export const getM365SyncStatus = async (): Promise<SyncStatus> => {
  const { data } = await api.get("/m365/sync/status");
  return data;
};

export const syncM365Users = async (): Promise<UserSyncResult> => {
  const { data } = await api.post("/m365/sync/users");
  return data;
};

export const syncM365Devices = async (): Promise<DeviceSyncResult> => {
  const { data } = await api.post("/m365/sync/devices");
  return data;
};
