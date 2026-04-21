import api from "../lib/api";

export type RetentionAction = "archive" | "purge";

export interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: RetentionAction;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunAffected: number;
  createdAt: string;
  updatedAt: string;
}

export const listRetentionPolicies = async (): Promise<RetentionPolicy[]> => {
  const { data } = await api.get("/retention");
  return data;
};

export const listSupportedEntities = async (): Promise<string[]> => {
  const { data } = await api.get("/retention/supported");
  return data;
};

export const createRetentionPolicy = async (input: {
  entityType: string;
  retentionDays: number;
  action?: RetentionAction;
  enabled?: boolean;
}): Promise<RetentionPolicy> => {
  const { data } = await api.post("/retention", input);
  return data;
};

export const updateRetentionPolicy = async (
  id: string,
  patch: Partial<Pick<RetentionPolicy, "retentionDays" | "action" | "enabled" | "entityType">>,
): Promise<RetentionPolicy> => {
  const { data } = await api.patch(`/retention/${id}`, patch);
  return data;
};

export const deleteRetentionPolicy = async (id: string): Promise<void> => {
  await api.delete(`/retention/${id}`);
};

export const runRetentionPolicy = async (id: string): Promise<{ affected: number }> => {
  const { data } = await api.post(`/retention/${id}/run`);
  return data;
};
