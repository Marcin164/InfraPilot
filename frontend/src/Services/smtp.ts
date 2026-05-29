import api from "../lib/api";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type SmtpPublicConfig = Omit<SmtpConfig, "pass"> & { hasPass: boolean };

export const getSmtpConfig = async (): Promise<SmtpPublicConfig> => {
  const { data } = await api.get("/smtp/config");
  return data;
};

export const saveSmtpConfig = async (
  config: SmtpConfig
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/smtp/config", config);
  return data;
};

export const deleteSmtpConfig = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const { data } = await api.delete("/smtp/config");
  return data;
};

export const testSmtpConnection = async (
  config: SmtpConfig
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post("/smtp/test", config);
  return data;
};
