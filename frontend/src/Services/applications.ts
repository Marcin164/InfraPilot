import api from "../lib/api";

export const getApplicationsTable = async () => {
  const { data } = await api.get("/applications/table");
  return data;
};

export const getApplication = async (id: string) => {
  const { data } = await api.get(`/applications/${id}`);
  return data;
};

export const getFilter = async () => {
  const { data } = await api.get("/applications/filters");
  return data;
};
