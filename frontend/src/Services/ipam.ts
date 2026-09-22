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
  source: "manual" | "sync" | "scan";
  leaseExpiresRaw: string | null;
  lastSeenAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type ScanCandidateDevice = {
  id: string;
  assetName?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
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
  locationId?: string | null;
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

export const updateSubnet = async (
  id: string,
  payload: Partial<CreateSubnetPayload>,
): Promise<Subnet> => {
  const { data } = await api.patch(`/ipam/subnets/${id}`, payload);
  return data;
};

export const deleteSubnet = async (id: string): Promise<void> => {
  await api.delete(`/ipam/subnets/${id}`);
};

export const getSubnetUtilization = async (id: string): Promise<SubnetUtilization> => {
  const { data } = await api.get(`/ipam/subnets/${id}/utilization`);
  return data;
};

export const getScanCandidates = async (subnetId: string): Promise<ScanCandidateDevice[]> => {
  const { data } = await api.get(`/ipam/subnets/${subnetId}/scan-candidates`);
  return data;
};

// Fallback list when getScanCandidates() can't confirm a match for a
// subnet (no location set, no agent IP in range) -- every enrolled
// Windows agent, so the admin can pick one manually instead of being
// blocked outright.
export const getAllWindowsAgents = async (): Promise<ScanCandidateDevice[]> => {
  const { data } = await api.get(`/ipam/scan-agents`);
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
