import api from "../lib/api";

export type NetworkLinkType = "ethernet" | "fiber" | "wifi" | "other";

export type NetworkConnection = {
  id: string;
  sourceDeviceId: string;
  sourcePort: string | null;
  targetDeviceId: string;
  targetPort: string | null;
  linkType: NetworkLinkType;
  vlan: string | null;
  notes: string | null;
  createdAt: string;
};

export type TopologyNode = {
  id: string;
  assetName: string | null;
  group: string | null;
  subgroup: string | null;
  manufacturer: string | null;
  model: string | null;
  lifecycle: string | null;
  managementIp: string | null;
};

export type Topology = {
  nodes: TopologyNode[];
  edges: NetworkConnection[];
};

export const getConnectionsForDevice = async (
  deviceId: string,
): Promise<NetworkConnection[]> => {
  const { data } = await api.get(`/network-connections?deviceId=${deviceId}`);
  return data;
};

export const getTopology = async (): Promise<Topology> => {
  const { data } = await api.get("/network-connections/topology");
  return data;
};

export type CreateConnectionPayload = {
  sourceDeviceId: string;
  sourcePort?: string;
  targetDeviceId: string;
  targetPort?: string;
  linkType?: NetworkLinkType;
  vlan?: string;
  notes?: string;
};

export const createConnection = async (
  payload: CreateConnectionPayload,
): Promise<NetworkConnection> => {
  const { data } = await api.post("/network-connections", payload);
  return data;
};

export const deleteConnection = async (id: string): Promise<void> => {
  await api.delete(`/network-connections/${id}`);
};
