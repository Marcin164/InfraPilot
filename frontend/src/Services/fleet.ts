import api from "../lib/api";

export type FleetOverview = {
  totalDevices: number;
  activeDevices: number;
  staleAgents: number;
  staleAgentsThresholdHours: number;
  newInLastWeek: number;
  lifecycle: Record<string, number>;
  compliance: {
    totalDevices: number;
    compliantDevices: number;
    compliancePct: number;
    bySeverity: Record<string, { failing: number; devices: number }>;
  };
  cves: Record<string, number>;
  generatedAt: string;
};

export const fleetOverview = async (): Promise<FleetOverview> => {
  const { data } = await api.get("/fleet/overview");
  return data;
};

export type StaleDevice = {
  id: string;
  assetName: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  lastScanAt: string | null;
  user: { id: string; name: string; surname: string } | null;
  lifecycle: string;
};

export const staleAgents = async (hours?: number): Promise<StaleDevice[]> => {
  const { data } = await api.get("/fleet/stale-agents", {
    params: hours ? { hours } : undefined,
  });
  return data;
};
