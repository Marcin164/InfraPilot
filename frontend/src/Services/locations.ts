import api from "../lib/api";

export type LocationType = "building" | "floor" | "room" | "rack" | "other";

export type Location = {
  id: string;
  name: string;
  type: LocationType;
  parentId: string | null;
  description: string | null;
  createdAt: string;
};

export type LocationTree = Location & { children: LocationTree[] };

export const getLocations = async (): Promise<Location[]> => {
  const { data } = await api.get("/locations");
  return data;
};

export const getLocationTree = async (): Promise<LocationTree[]> => {
  const { data } = await api.get("/locations/tree");
  return data;
};

export const createLocation = async (payload: {
  name: string;
  type?: LocationType;
  parentId?: string | null;
  description?: string | null;
}): Promise<Location> => {
  const { data } = await api.post("/locations", payload);
  return data;
};

export const updateLocation = async (
  id: string,
  payload: Partial<{ name: string; type: LocationType; parentId: string | null; description: string | null }>,
): Promise<Location> => {
  const { data } = await api.patch(`/locations/${id}`, payload);
  return data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};
