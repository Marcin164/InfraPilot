import api from "../lib/api";
import type { AuditEntry } from "./audit";

export interface PersonalData {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  company: string;
  office: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  manager: string;
  distinguishedName: string;
  whenCreated: string;
}

export const getPersonalData = async (id: string): Promise<PersonalData> => {
  const { data } = await api.get(`/privacy/user/${id}`);
  return data;
};

export const listPrivacyAccessLog = async (params: {
  targetUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AuditEntry[]; nextCursor: string | null }> => {
  const { data } = await api.get("/privacy/access-log", { params });
  return data;
};

export const exportUserDsar = async (id: string): Promise<Blob> => {
  const res = await api.post(
    `/privacy/user/${id}/export`,
    {},
    { responseType: "blob" },
  );
  return res.data as Blob;
};

export type ErasureResult = {
  requestId: string;
  status: "completed" | "rejected";
  fieldsNulled: string[];
  itemsRetained: { category: string; reason: string; count?: number }[];
  activeLegalHolds?: {
    id: string;
    reason: string;
    retainUntil: string | null;
  }[];
};

export const eraseUser = async (
  id: string,
  reason: string,
): Promise<ErasureResult> => {
  const { data } = await api.post(`/privacy/user/${id}/erase`, { reason });
  return data;
};

export type LegalHold = {
  id: string;
  userId: string;
  reason: string;
  legalBasis: string | null;
  retainUntil: string | null;
  createdBy: string;
  createdAt: string;
  releasedAt: string | null;
  releasedBy: string | null;
  releasedReason: string | null;
};

export const listLegalHolds = async (params: {
  userId?: string;
  activeOnly?: boolean;
}): Promise<LegalHold[]> => {
  const { data } = await api.get("/legal-holds", { params });
  return data;
};

export const createLegalHold = async (input: {
  userId: string;
  reason: string;
  legalBasis?: string;
  retainUntil?: string;
}): Promise<LegalHold> => {
  const { data } = await api.post("/legal-holds", input);
  return data;
};

export const releaseLegalHold = async (
  id: string,
  releasedReason: string,
): Promise<LegalHold> => {
  const { data } = await api.post(`/legal-holds/${id}/release`, {
    releasedReason,
  });
  return data;
};
