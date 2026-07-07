import api from "../lib/api";
import type { User, CreateUserData, UserFilter } from "../Types";

export type AuthLinkResult = {
  linked: boolean;
  authUserId: string | null;
  reason?: string;
};

export type AuthVerifyResult = {
  valid: boolean;
  authUserId: string | null;
  email?: string;
};

export const linkUserAuth = async (id: string): Promise<AuthLinkResult> => {
  const { data } = await api.post(`/users/${id}/link-auth`);
  return data;
};

export const provisionUserAuth = async (
  id: string,
): Promise<{ authUserId: string | null; created: boolean; reason?: string }> => {
  const { data } = await api.post(`/users/${id}/provision-auth`);
  return data;
};

export const verifyUserAuth = async (
  id: string,
): Promise<AuthVerifyResult> => {
  const { data } = await api.get(`/users/${id}/verify-auth`);
  return data;
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users/");
  return data;
};

export const addUser = async (
  data: CreateUserData | Record<string, unknown>,
): Promise<User> => {
  const { data: result } = await api.post("/users/", data);
  return result;
};

export const addManyUsers = async (
  data: Record<string, unknown>[],
): Promise<User[]> => {
  const { data: result } = await api.post("/users/many", { users: data });
  return result;
};

export const updateUser = async (
  data: Partial<User>,
  id: string,
): Promise<User> => {
  const { data: result } = await api.patch(`/users/${id}`, data);
  return result;
};

export const deleteUser = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const getUsersTable = async (
  query: string = "",
): Promise<{ data: User[]; total: number }> => {
  const { data } = await api.get(`/users/table${query ? `?${query}` : ""}`);
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
