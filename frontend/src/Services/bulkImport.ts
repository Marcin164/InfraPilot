import api from "../lib/api";

export type ImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

export const bulkImportDevices = async (rows: Record<string, any>[]): Promise<ImportResult> => {
  const { data } = await api.post("/devices/bulk-import", { rows });
  return data;
};

export const bulkImportUsers = async (rows: Record<string, any>[]): Promise<ImportResult> => {
  const { data } = await api.post("/users/bulk-import", { rows });
  return data;
};
