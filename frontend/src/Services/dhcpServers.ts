import api from "../lib/api";

export type DhcpDriverType = "ssh_scrape";
export type DhcpSyncStatus = "success" | "failed";

export type DhcpServer = {
  id: string;
  name: string;
  driverType: DhcpDriverType;
  deviceId: string | null;
  device?: { id: string; assetName?: string | null; model?: string | null } | null;
  config: Record<string, unknown>;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: DhcpSyncStatus | null;
  lastSyncError: string | null;
  lastSyncRecordCount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDhcpServerPayload = {
  name: string;
  driverType: DhcpDriverType;
  deviceId?: string | null;
  config?: Record<string, unknown>;
  enabled?: boolean;
};

export type UpdateDhcpServerPayload = Partial<CreateDhcpServerPayload>;

export const getDhcpServers = async (): Promise<DhcpServer[]> => {
  const { data } = await api.get("/dhcp-servers");
  return data;
};

export const createDhcpServer = async (payload: CreateDhcpServerPayload): Promise<DhcpServer> => {
  const { data } = await api.post("/dhcp-servers", payload);
  return data;
};

export const updateDhcpServer = async (
  id: string,
  payload: UpdateDhcpServerPayload,
): Promise<DhcpServer> => {
  const { data } = await api.put(`/dhcp-servers/${id}`, payload);
  return data;
};

export const deleteDhcpServer = async (id: string): Promise<void> => {
  await api.delete(`/dhcp-servers/${id}`);
};

export const runDhcpServerSync = async (id: string): Promise<{ recordsFound: number }> => {
  const { data } = await api.post(`/dhcp-servers/${id}/sync`);
  return data;
};
