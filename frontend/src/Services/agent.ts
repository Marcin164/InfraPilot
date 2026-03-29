import api from "../lib/api";

export const getSettings = async () => {
  const { data } = await api.get("/agent/settings");
  return data;
};
