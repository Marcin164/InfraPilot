import api from "../lib/api";

export type FormItem = {
  id: string;
  userId: string;
  name: string;
  url: string;
  mimetype?: string;
  size?: number;
  createdAt?: string;
};

export const getUserForms = async (userId: string): Promise<FormItem[]> => {
  const { data } = await api.get(`/forms/user/${userId}`);
  return data;
};

export const getForm = async (id: string): Promise<Blob> => {
  const { data } = await api.get(`/forms/${id}`, { responseType: "blob" });
  return data;
};

export const addForm = async (
  file: File,
  userId: string,
): Promise<FormItem> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  const { data } = await api.post("/forms", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteForm = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/forms/${id}`);
  return data;
};
