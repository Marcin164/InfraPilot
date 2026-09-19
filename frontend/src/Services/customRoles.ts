import api from "../lib/api";

export type PermissionCatalogEntry = { code: string; label: string };
export type PermissionGroup = {
  key: string;
  label: string;
  permissions: PermissionCatalogEntry[];
};
export type PermissionCatalog = {
  groups: PermissionGroup[];
  implies: Record<string, string[]>;
};

export type CustomRole = {
  id: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  grantsAllPermissions: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CustomRoleWritePayload = {
  name?: string;
  description?: string;
  grantsAllPermissions?: boolean;
  permissions?: string[];
};

export const getPermissionCatalog = async (): Promise<PermissionCatalog> => {
  const { data } = await api.get("/custom-roles/catalog");
  return data;
};

export const getCustomRoles = async (): Promise<CustomRole[]> => {
  const { data } = await api.get("/custom-roles");
  return data;
};

export const createCustomRole = async (
  payload: CustomRoleWritePayload,
): Promise<CustomRole> => {
  const { data } = await api.post("/custom-roles", payload);
  return data;
};

export const updateCustomRole = async (
  id: string,
  payload: CustomRoleWritePayload,
): Promise<CustomRole> => {
  const { data } = await api.patch(`/custom-roles/${id}`, payload);
  return data;
};

export const deleteCustomRole = async (
  id: string,
): Promise<{ success: boolean }> => {
  const { data } = await api.delete(`/custom-roles/${id}`);
  return data;
};

export const assignCustomRole = async (
  roleId: string,
  userId: string,
): Promise<{ success: boolean }> => {
  const { data } = await api.post(`/custom-roles/${roleId}/users/${userId}`);
  return data;
};

export const unassignCustomRole = async (
  roleId: string,
  userId: string,
): Promise<{ success: boolean }> => {
  const { data } = await api.delete(`/custom-roles/${roleId}/users/${userId}`);
  return data;
};

export const getCustomRoleAssignments = async (
  userIds: string[],
): Promise<Record<string, string[]>> => {
  if (!userIds.length) return {};
  const { data } = await api.get(
    `/custom-roles/assignments?userIds=${encodeURIComponent(userIds.join(","))}`,
  );
  return data;
};
