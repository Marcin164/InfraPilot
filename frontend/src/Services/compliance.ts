import api from "../lib/api";

export type ComplianceOperator =
  | "eq"
  | "ne"
  | "gte"
  | "lte"
  | "exists"
  | "notExists"
  | "contains"
  | "notContains";

export type ComplianceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ComplianceRule = {
  key: string;
  name: string;
  description: string | null;
  category: string;
  jsonPath: string;
  operator: ComplianceOperator;
  expected: any;
  severity: ComplianceSeverity;
  enabled: boolean;
  builtin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ComplianceResult = {
  id: string;
  deviceId: string;
  ruleKey: string;
  rule: ComplianceRule;
  passed: boolean;
  severity: string;
  actual: any;
  message: string | null;
  evaluatedAt: string;
};

export type ComplianceSummary = {
  totalDevices: number;
  compliantDevices: number;
  compliancePct: number;
  bySeverity: Record<
    string,
    { failing: number; devices: number }
  >;
};

export const listComplianceRules = async (): Promise<ComplianceRule[]> => {
  const { data } = await api.get("/compliance/rules");
  return data;
};

export const upsertComplianceRule = async (
  key: string,
  patch: Partial<ComplianceRule>,
): Promise<ComplianceRule> => {
  const { data } = await api.put(`/compliance/rules/${key}`, patch);
  return data;
};

export const deleteComplianceRule = async (key: string): Promise<void> => {
  await api.delete(`/compliance/rules/${key}`);
};

export const complianceForDevice = async (
  deviceId: string,
): Promise<ComplianceResult[]> => {
  const { data } = await api.get(`/compliance/device/${deviceId}`);
  return data;
};

export const evaluateDevice = async (
  deviceId: string,
): Promise<ComplianceResult[]> => {
  const { data } = await api.post(`/compliance/device/${deviceId}/evaluate`);
  return data;
};

export const complianceSummary = async (): Promise<ComplianceSummary> => {
  const { data } = await api.get("/compliance/summary");
  return data;
};
