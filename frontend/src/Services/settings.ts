import api from "../lib/api";

export const getUserSettings = async () => {
  const { data } = await api.get("/settings");
  return data;
};

export const updateUserSettings = async (data: any) => {
  const { data: result } = await api.patch("/settings", data);
  return result;
};
