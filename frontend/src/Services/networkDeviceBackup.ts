import api from "../lib/api";

export type SshCredential = {
  deviceId: string;
  sshUsername: string;
  sshPort: number;
  backupCommand: string;
  backupEnabled: boolean;
  hasPassword: boolean;
  leaseSyncCommand: string | null;
  leaseSyncLineTemplate: string | null;
  leaseSyncEnabled: boolean;
  updatedAt: string;
} | null;

export type SetCredentialPayload = {
  sshUsername: string;
  sshPassword?: string;
  sshPort?: number;
  backupCommand: string;
  backupEnabled?: boolean;
};

export type SetLeaseSyncPayload = {
  leaseSyncCommand: string;
  leaseSyncLineTemplate: string;
  leaseSyncEnabled?: boolean;
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

export const setLeaseSync = async (
  deviceId: string,
  payload: SetLeaseSyncPayload,
): Promise<SshCredential> => {
  const { data } = await api.put(`/devices/${deviceId}/lease-sync`, payload);
  return data;
};

export const runLeaseSyncNow = async (deviceId: string): Promise<{ recordsFound: number }> => {
  const { data } = await api.post(`/devices/${deviceId}/lease-sync/run`);
  return data;
};
