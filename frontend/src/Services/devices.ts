import api from "../lib/api";

export const addDevice = async (data: any) => {
  const { data: result } = await api.post("/devices/", data);
  return result;
};

export const assignDevice = async (data: any) => {
  const { data: result } = await api.post("/devices/assign", data);
  return result;
};

export const getDevicesOptions = async () => {
  const { data } = await api.get("/devices/options");
  return data;
};

export const getDevices = async () => {
  const { data } = await api.get("/devices/table");
  return data;
};

export const getDevicesByOwner = async (idUser: string) => {
  const { data } = await api.get(`/devices/user/${idUser}`);
  return data;
};

export const getDevice = async (idDevice: string) => {
  const { data } = await api.get(`/devices/${idDevice}`);
  return data;
};

export const getDevicesWithApplication = async (id: string) => {
  const { data } = await api.get(`/devices/application/${id}`);
  return data;
};

export const getFilter = async () => {
  const { data } = await api.get("/devices/filters");
  return data;
};
