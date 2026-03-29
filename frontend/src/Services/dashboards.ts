import api from "../lib/api";

export const getDashboards = async () => {
  const { data } = await api.get("/dashboards");
  return data;
};

export const createDashboard = async (body: any) => {
  const { data } = await api.post("/dashboards", body);
  return data;
};
