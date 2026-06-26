import api from "../lib/api";

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  sequence: string;
  hash: string | null;
  prevHash: string | null;
};

export type AuditVerifyResult = {
  ok: boolean;
  total: number;
  firstMismatchSequence: string | null;
  mismatchReason: string | null;
};

export type AuditListResult = {
  items: AuditEntry[];
  nextCursor: string | null;
};

export const listAudit = async (query: {
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}): Promise<AuditListResult> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.append(k, String(v));
    }
  });
  const { data } = await api.get(`/audit?${params.toString()}`);
  return data;
};

export const verifyAudit = async (): Promise<AuditVerifyResult> => {
  const { data } = await api.get(`/audit/verify`);
  return data;
};

export const exportAuditCsv = async (query: {
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
}): Promise<void> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) params.append(k, v);
  });
  const res = await api.get(`/audit/export?${params.toString()}`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data as Blob], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
