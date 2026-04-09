import api from "../lib/api";
import type { User } from "../Types";

export type AssignmentGroup = {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt?: string;
};

export const getAssignmentGroups = async (): Promise<AssignmentGroup[]> => {
  const { data } = await api.get("/assignment-groups");
  return data;
};

export const getAssignmentGroup = async (
  id: string,
): Promise<AssignmentGroup> => {
  const { data } = await api.get(`/assignment-groups/${id}`);
  return data;
};

export const getAssignmentGroupMembers = async (
  idOrName: string,
): Promise<User[]> => {
  const { data } = await api.get(
    `/assignment-groups/${encodeURIComponent(idOrName)}/members`,
  );
  return data;
};

export const createAssignmentGroup = async (payload: {
  name: string;
  description?: string;
}): Promise<AssignmentGroup> => {
  const { data } = await api.post("/assignment-groups", payload);
  return data;
};

export const updateAssignmentGroup = async (
  id: string,
  payload: { name?: string; description?: string },
): Promise<AssignmentGroup> => {
  const { data } = await api.patch(`/assignment-groups/${id}`, payload);
  return data;
};

export const deleteAssignmentGroup = async (
  id: string,
): Promise<{ success: boolean }> => {
  const { data } = await api.delete(`/assignment-groups/${id}`);
  return data;
};

export const setAssignmentGroupMembers = async (
  id: string,
  userIds: string[],
): Promise<AssignmentGroup> => {
  const { data } = await api.put(`/assignment-groups/${id}/members`, {
    userIds,
  });
  return data;
};

export const addAssignmentGroupMember = async (
  id: string,
  userId: string,
): Promise<AssignmentGroup> => {
  const { data } = await api.post(`/assignment-groups/${id}/members/${userId}`);
  return data;
};

export const removeAssignmentGroupMember = async (
  id: string,
  userId: string,
): Promise<AssignmentGroup> => {
  const { data } = await api.delete(
    `/assignment-groups/${id}/members/${userId}`,
  );
  return data;
};
