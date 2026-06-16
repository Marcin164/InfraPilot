import api from "../lib/api";
import type { Dashboard } from "../Types";

export const getDashboards = async (): Promise<Dashboard[]> => {
  const { data } = await api.get("/dashboards");
  return data;
};

export const createDashboard = async (body: { name: string; userId: string; cards?: Dashboard["cards"] }): Promise<Dashboard> => {
  const { data } = await api.post("/dashboards", body);
  return data;
};

export const deleteDashboard = async (id: string): Promise<void> => {
  await api.delete(`/dashboards/${id}`);
};
