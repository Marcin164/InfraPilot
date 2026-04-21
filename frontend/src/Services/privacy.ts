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
