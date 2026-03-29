import api from "../lib/api";

export const getReports = async (type: string) => {
  const { data } = await api.get(`/reports?type=${type}`);
  return data;
};
