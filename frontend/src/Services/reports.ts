import api from "../lib/api";
import type { ReportDataPoint } from "../Types";

export type ReportChart = "bar" | "pie" | "line" | "table";
export type ReportCategory =
  | "users"
  | "devices"
  | "security"
  | "tickets"
  | "sla"
  | "applications"
  | "histories"
  | "audit"
  | "forms";

export interface ReportMeta {
  key: string;
  title: string;
  description: string;
  category: ReportCategory;
  chart: ReportChart;
  supportsFilters?: Array<"from" | "to" | "department" | "application">;
  aliases?: string[];
}

export const getReports = async (
  type: string,
  filters?: Record<string, string | number | undefined>
): Promise<ReportDataPoint[]> => {
  const { data } = await api.get(`/reports`, {
    params: { type, ...filters },
  });
  return data;
};

export const listReports = async (): Promise<ReportMeta[]> => {
  const { data } = await api.get(`/reports/list`);
  return data;
};

export const reportExportUrl = (
  type: string,
  filters?: Record<string, string | number | undefined>
): string => {
  const params = new URLSearchParams({ type });
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
  }
  return `/reports/export?${params.toString()}`;
};
