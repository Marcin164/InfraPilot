import api from "../lib/api";

export const createHistoryEntry = async (data: any) => {
  const { data: result } = await api.post("/histories/", data);
  return result;
};

export const getDeviceHistory = async (deviceId: string) => {
  const { data } = await api.get(`/histories/device/${deviceId}`);
  return data;
};

export const getUsersDevices = async (userId: string) => {
  const { data } = await api.get(`/histories/user/${userId}`);
  return data;
};
