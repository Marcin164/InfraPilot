import api from "../lib/api";

export const getShifts = async (): Promise<any> => {
  const { data } = await api.get("/shifts");
  return data;
};

export const createShift = async (payload:any): Promise<any> => {
  const { data } = await api.post("/shifts", payload);
  return data
}

export const updateShift = async (id: string, payload: any): Promise<any> => {
  const { data } = await api.patch(`/shifts/${id}`, payload);
  return data
}

export const deleteShift = async (id: string): Promise<any> => {
  const { data } = await api.delete(`/shifts/${id}`);
  return data
}