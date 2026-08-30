import api from "../lib/api";

export type SshCredential = {
  deviceId: string;
  sshUsername: string;
  sshPort: number;
  backupCommand: string;
  backupEnabled: boolean;
  hasPassword: boolean;
  updatedAt: string;
} | null;

export type SetCredentialPayload = {
  sshUsername: string;
  sshPassword?: string;
  sshPort?: number;
  backupCommand: string;
  backupEnabled?: boolean;
};

export type ConfigBackup = {
  id: string;
  deviceId: string;
  content?: string | null;
  contentHash: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export const getSshCredential = async (deviceId: string): Promise<SshCredential> => {
  const { data } = await api.get(`/devices/${deviceId}/ssh-credential`);
  return data;
};

export const setSshCredential = async (
  deviceId: string,
  payload: SetCredentialPayload,
): Promise<SshCredential> => {
  const { data } = await api.put(`/devices/${deviceId}/ssh-credential`, payload);
  return data;
};

export const runBackupNow = async (deviceId: string): Promise<ConfigBackup> => {
  const { data } = await api.post(`/devices/${deviceId}/backup/run`);
  return data;
};

export const listBackups = async (deviceId: string): Promise<ConfigBackup[]> => {
  const { data } = await api.get(`/devices/${deviceId}/backups`);
  return data;
};

export const getBackup = async (deviceId: string, backupId: string): Promise<ConfigBackup> => {
  const { data } = await api.get(`/devices/${deviceId}/backups/${backupId}`);
  return data;
};
