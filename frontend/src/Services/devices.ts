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

export const getDevices = async (): Promise<Device[]> => {
  const { data } = await api.get("/devices/table");
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

export const getFilter = async (): Promise<DeviceFilter> => {
  const { data } = await api.get("/devices/filters");
  return data;
};
