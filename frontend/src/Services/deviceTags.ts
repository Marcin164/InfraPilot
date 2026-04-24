import api from "../lib/api";

export type DeviceTag = {
  id: string;
  key: string;
  label: string;
  color: string;
  description: string | null;
  createdAt: string;
};

export const listDeviceTags = async (): Promise<DeviceTag[]> => {
  const { data } = await api.get("/devices/tags");
  return data;
};

export const createDeviceTag = async (input: {
  key: string;
  label: string;
  color?: string;
  description?: string;
}): Promise<DeviceTag> => {
  const { data } = await api.post("/devices/tags", input);
  return data;
};

export const deleteDeviceTag = async (id: string): Promise<void> => {
  await api.post(`/devices/tags/${id}/delete`);
};

export const tagsForDevice = async (
  deviceId: string,
): Promise<DeviceTag[]> => {
  const { data } = await api.get(`/devices/${deviceId}/tags`);
  return data;
};

export const bulkTagDevices = async (input: {
  deviceIds: string[];
  tagIds: string[];
  action: "attach" | "detach";
}): Promise<{ affected: number }> => {
  const { data } = await api.post("/devices/bulk/tag", input);
  return data;
};

export const bulkAssignDevices = async (input: {
  deviceIds: string[];
  userId: string | null;
}): Promise<{ affected: number }> => {
  const { data } = await api.post("/devices/bulk/assign", input);
  return data;
};

export const bulkLifecycleDevices = async (input: {
  deviceIds: string[];
  lifecycle: string;
  note?: string;
}): Promise<{ affected: number }> => {
  const { data } = await api.post("/devices/bulk/lifecycle", input);
  return data;
};
