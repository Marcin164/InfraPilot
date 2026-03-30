import api from "../lib/api";
import type { User, CreateUserData, UserFilter } from "../Types";

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users/");
  return data;
};

export const addUser = async (data: CreateUserData | Record<string, unknown>): Promise<User> => {
  const { data: result } = await api.post("/users/", data);
  return result;
};

export const addManyUsers = async (data: Record<string, unknown>[]): Promise<User[]> => {
  const { data: result } = await api.post("/users/many", data);
  return result;
};

export const updateUser = async (data: Partial<User>, id: string): Promise<User> => {
  const { data: result } = await api.patch(`/users/${id}`, data);
  return result;
};

export const deleteUser = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const getUsersTable = async (): Promise<User[]> => {
  const { data } = await api.get("/users/table");
  return data;
};

export const getUser = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

export const getFilter = async (): Promise<UserFilter> => {
  const { data } = await api.get("/users/filters");
  return data;
};

export const findApprovers = async (): Promise<User[]> => {
  const { data } = await api.get("/users/approvers");
  return data;
};
