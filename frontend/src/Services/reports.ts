import api from "../lib/api";
import type { ReportDataPoint } from "../Types";

export const getReports = async (type: string): Promise<ReportDataPoint[]> => {
  const { data } = await api.get(`/reports?type=${type}`);
  return data;
};
