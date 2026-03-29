import api from "../lib/api";

export const getUsers = async () => {
  const { data } = await api.get("/users/");
  return data;
};

export const addUser = async (data: any) => {
  const { data: result } = await api.post("/users/", data);
  return result;
};

export const addManyUsers = async (data: any) => {
  const { data: result } = await api.post("/users/many", data);
  return result;
};

export const updateUser = async (data: any, id: string) => {
  const { data: result } = await api.patch(`/users/${id}`, data);
  return result;
};

export const deleteUser = async (id: string) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const getUsersTable = async () => {
  const { data } = await api.get("/users/table");
  return data;
};

export const getUser = async (id: string) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

export const getFilter = async () => {
  const { data } = await api.get("/users/filters");
  return data;
};

export const findApprovers = async () => {
  const { data } = await api.get("/users/approvers");
  return data;
};
