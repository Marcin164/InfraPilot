import api from "../lib/api";

export type SodPair = { a: string; b: string; reason: string };

export type SodMatrix = { pairs: SodPair[] };

export const getSodMatrix = async (): Promise<SodMatrix> => {
  const { data } = await api.get("/rbac/sod");
  return data;
};
