import api from "../lib/api";
import type { Application } from "../Types";

export const getApplicationsTable = async (): Promise<Application[]> => {
  const { data } = await api.get("/applications/table");
  return data;
};

export const getApplication = async (id: string): Promise<Application> => {
  const { data } = await api.get(`/applications/${id}`);
  return data;
};

export const getFilter = async (): Promise<{ publisher?: string[] }> => {
  const { data } = await api.get("/applications/filters");
  return data;
};

export const searchApplications = async (
  q: string
): Promise<Array<{ name: string }>> => {
  if (!q) return [];
  const { data } = await api.get("/applications/search", { params: { q } });
  return data;
};
