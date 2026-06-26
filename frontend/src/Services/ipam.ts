import api from "../lib/api";

export type Subnet = {
  id: string;
  name: string;
  cidr: string;
  vlan: string | null;
  gateway: string | null;
  dnsServers: string[] | null;
  locationId: string | null;
  notes: string | null;
  createdAt: string;
};

export type AllocationStatus = "reserved" | "assigned" | "leased";

export type IpAllocation = {
  id: string;
  subnetId: string | null;
  ip: string;
  status: AllocationStatus;
  deviceId: string | null;
  hostname: string | null;
  macAddress: string | null;
  source: "manual" | "sync";
  leaseExpiresRaw: string | null;
  lastSeenAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type SubnetUtilization = {
  subnet: Subnet;
  total: number;
  used: number;
  free: number;
  entries: Array<{ id: string | null; ip: string; label: string; deviceId: string | null; source: string }>;
};

export type IpConflict = {
  ip: string;
  owners: Array<{ key: string; label: string }>;
};

export type CreateSubnetPayload = {
  name: string;
  cidr: string;
  vlan?: string;
  gateway?: string;
  dnsServers?: string[];
  locationId?: string;
  notes?: string;
};

export type CreateAllocationPayload = {
  subnetId?: string;
  ip: string;
  status: AllocationStatus;
  deviceId?: string;
  hostname?: string;
  macAddress?: string;
  notes?: string;
};

export const getSubnets = async (): Promise<Subnet[]> => {
  const { data } = await api.get("/ipam/subnets");
  return data;
};

export const createSubnet = async (payload: CreateSubnetPayload): Promise<Subnet> => {
  const { data } = await api.post("/ipam/subnets", payload);
  return data;
};

export const deleteSubnet = async (id: string): Promise<void> => {
  await api.delete(`/ipam/subnets/${id}`);
};

export const getSubnetUtilization = async (id: string): Promise<SubnetUtilization> => {
  const { data } = await api.get(`/ipam/subnets/${id}/utilization`);
  return data;
};

export const getAllocations = async (subnetId?: string): Promise<IpAllocation[]> => {
  const { data } = await api.get(`/ipam/allocations${subnetId ? `?subnetId=${subnetId}` : ""}`);
  return data;
};

export const createAllocation = async (payload: CreateAllocationPayload): Promise<IpAllocation> => {
  const { data } = await api.post("/ipam/allocations", payload);
  return data;
};

export const deleteAllocation = async (id: string): Promise<void> => {
  await api.delete(`/ipam/allocations/${id}`);
};

export const getIpConflicts = async (): Promise<IpConflict[]> => {
  const { data } = await api.get("/ipam/conflicts");
  return data;
};
