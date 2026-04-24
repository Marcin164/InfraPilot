import api from "../lib/api";

export type CveSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export type DeviceCve = {
  id: string;
  cveId: string;
  severity: CveSeverity;
  summary: string | null;
  publishedAt: string | null;
  version: string | null;
  applicationId: string;
  applicationName: string;
  publisher: string | null;
};

export type CveSummary = Record<CveSeverity, number>;

export const cvesForDevice = async (deviceId: string): Promise<DeviceCve[]> => {
  const { data } = await api.get(`/cve/device/${deviceId}`);
  return data;
};

export const cveSummary = async (): Promise<CveSummary> => {
  const { data } = await api.get("/cve/summary");
  return data;
};

export const reconcileCves = async (): Promise<{
  queried: number;
  matchesFound: number;
  newMatches: number;
}> => {
  const { data } = await api.post("/cve/reconcile");
  return data;
};
