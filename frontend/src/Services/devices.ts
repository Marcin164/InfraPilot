import api from "../lib/api";
import type { Device, DeviceOption, DeviceFilter } from "../Types";

export const addDevice = async (data: Record<string, unknown>): Promise<Device> => {
  const { data: result } = await api.post("/devices/", data);
  return result;
};

export const assignDevice = async (data: { deviceId: string | number; userId: string | null }): Promise<Device> => {
  const { data: result } = await api.post("/devices/assign", data);
  return result;
};

export const getDevicesOptions = async (): Promise<DeviceOption[]> => {
  const { data } = await api.get("/devices/options");
  return data;
};

export const getDevices = async (
  query: string = "",
): Promise<{ data: Device[]; total: number }> => {
  const { data } = await api.get(`/devices/table${query ? `?${query}` : ""}`);
  return data;
};

export const getDevicesByOwner = async (idUser: string): Promise<Device[]> => {
  const { data } = await api.get(`/devices/user/${idUser}`);
  return data;
};

export const getDevice = async (idDevice: string): Promise<Device> => {
  const { data } = await api.get(`/devices/${idDevice}`);
  return data;
};

export const getDevicesWithApplication = async (id: string): Promise<Device[]> => {
  const { data } = await api.get(`/devices/application/${id}`);
  return data;
};

export type DeviceLifecyclePatch = {
  lifecycle?: string;
  lifecycleNote?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  purchaseCurrency?: string;
  vendor?: string;
  purchaseOrder?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  retiredAt?: string;
  disposedAt?: string;
  disposalMethod?: string;
};

export const updateDeviceLifecycle = async (
  deviceId: string,
  patch: DeviceLifecyclePatch,
): Promise<Device> => {
  const { data } = await api.patch(`/devices/${deviceId}/lifecycle`, patch);
  return data;
};

export type DeviceInstall = {
  id: string;
  applicationId: string;
  version: string | null;
  installationDate: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  uninstalledAt: string | null;
  application: {
    id: string;
    name: string;
    publisher: string | null;
  };
};

export const getDeviceSoftware = async (
  deviceId: string,
  includeUninstalled = false,
): Promise<DeviceInstall[]> => {
  const { data } = await api.get(`/devices/${deviceId}/software`, {
    params: includeUninstalled ? { includeUninstalled: "true" } : undefined,
  });
  return data;
};

export type ScanListItem = {
  id: string;
  receivedAt: string;
  snapshotSha256: string;
};

export type ScanDiff = {
  from: { id: string; receivedAt: string; snapshotSha256: string };
  to: { id: string; receivedAt: string; snapshotSha256: string };
  changedSections: string[];
  software: {
    added: Array<{ name: string; version: string | null }>;
    removed: Array<{ name: string; version: string | null }>;
    versionChanged: Array<{
      name: string;
      from: string | null;
      to: string | null;
    }>;
  };
  fieldChanges: Array<{
    section: string;
    path: string;
    before: any;
    after: any;
  }>;
};

export const listDeviceScans = async (
  deviceId: string,
  limit = 50,
): Promise<ScanListItem[]> => {
  const { data } = await api.get(`/devices/${deviceId}/scans`, {
    params: { limit },
  });
  return data;
};

export const diffDeviceScans = async (
  deviceId: string,
  fromId?: string,
  toId?: string,
): Promise<ScanDiff | null> => {
  const { data } = await api.get(`/devices/${deviceId}/scans/diff`, {
    params: fromId && toId ? { from: fromId, to: toId } : undefined,
  });
  return data;
};

export const downloadDeviceReportPdf = async (
  deviceId: string,
  filename = `device-${deviceId}.pdf`,
): Promise<void> => {
  const res = await api.get(`/devices/${deviceId}/report.pdf`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data as Blob], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const getFilter = async (): Promise<DeviceFilter> => {
  const { data } = await api.get("/devices/filters");
  return data;
};

export const rotateAgentSecret = async (deviceId: string): Promise<{ secret: string }> => {
  const { data } = await api.post(`/devices/${deviceId}/agent/secret`);
  return data;
};

export const revokeAgentSecret = async (deviceId: string): Promise<{ ok: boolean }> => {
  const { data } = await api.post(`/devices/${deviceId}/agent/secret/revoke`);
  return data;
};
