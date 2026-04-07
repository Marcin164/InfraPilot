import api from "../lib/api";

export interface AdConfig {
  url: string;
  baseDN: string;
  username: string;
  password: string;
}

export interface AdStatus {
  connected: boolean;
  url: string | null;
  baseDN: string | null;
  lastSync: string | null;
  lastSyncUsersCount: number | null;
  hasCertificate: boolean;
}

export interface AdActionResult {
  success: boolean;
  message: string;
  usersCount?: number;
}

export const getAdStatus = async (): Promise<AdStatus> => {
  const { data } = await api.get("/active-directory/status");
  return data;
};

export const connectAd = async (config: AdConfig): Promise<AdActionResult> => {
  const { data } = await api.post("/active-directory/connect", config);
  return data;
};

export const disconnectAd = async (password: string): Promise<AdActionResult> => {
  const { data } = await api.post("/active-directory/disconnect", { password });
  return data;
};

export const testAdConnection = async (config: AdConfig): Promise<AdActionResult> => {
  const { data } = await api.post("/active-directory/test", config);
  return data;
};

export const syncAdUsers = async (): Promise<AdActionResult> => {
  const { data } = await api.post("/active-directory/sync");
  return data;
};

export const uploadAdCertificate = async (file: File): Promise<AdActionResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/active-directory/certificate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteAdCertificate = async (): Promise<AdActionResult> => {
  const { data } = await api.delete("/active-directory/certificate");
  return data;
};
