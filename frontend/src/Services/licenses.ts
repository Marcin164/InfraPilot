import api from "../lib/api";

export type LicenseType = "perpetual" | "subscription" | "volume" | "concurrent";

export type SoftwareLicense = {
  id: string;
  name: string;
  publisher: string | null;
  licenseType: LicenseType;
  totalSeats: number | null;
  licenseKey: string | null;
  purchaseDate: string | null;
  expiresAt: string | null;
  cost: string | null;
  currency: string | null;
  vendor: string | null;
  notes: string | null;
  createdAt: string;
  usedSeats: number;
};

export type SoftwareLicenseAssignment = {
  id: string;
  licenseId: string;
  deviceId: string | null;
  userId: string | null;
  assignedAt: string;
  device?: { id: string; assetName: string | null; serialNumber: string | null } | null;
  user?: { id: string; name: string | null; surname: string | null; email: string | null } | null;
};

export type CreateLicensePayload = {
  name: string;
  publisher?: string;
  licenseType?: LicenseType;
  totalSeats?: number;
  licenseKey?: string;
  purchaseDate?: string;
  expiresAt?: string;
  cost?: string;
  currency?: string;
  vendor?: string;
  notes?: string;
};

export const getLicenses = async (): Promise<SoftwareLicense[]> => {
  const { data } = await api.get("/licenses");
  return data;
};

export const getLicense = async (id: string): Promise<SoftwareLicense> => {
  const { data } = await api.get(`/licenses/${id}`);
  return data;
};

export const createLicense = async (
  payload: CreateLicensePayload,
): Promise<SoftwareLicense> => {
  const { data } = await api.post("/licenses", payload);
  return data;
};

export const updateLicense = async (
  id: string,
  payload: Partial<CreateLicensePayload>,
): Promise<SoftwareLicense> => {
  const { data } = await api.patch(`/licenses/${id}`, payload);
  return data;
};

export const deleteLicense = async (id: string): Promise<void> => {
  await api.delete(`/licenses/${id}`);
};

export const getLicenseAssignments = async (
  licenseId: string,
): Promise<SoftwareLicenseAssignment[]> => {
  const { data } = await api.get(`/licenses/${licenseId}/assignments`);
  return data;
};

export const createAssignment = async (payload: {
  licenseId: string;
  deviceId?: string;
  userId?: string;
}): Promise<SoftwareLicenseAssignment> => {
  const { data } = await api.post("/licenses/assignments", payload);
  return data;
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  await api.delete(`/licenses/assignments/${assignmentId}`);
};
