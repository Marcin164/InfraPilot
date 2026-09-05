import api from "../lib/api";

export type LocationType = "building" | "floor" | "room" | "rack" | "other";

export type Location = {
  id: string;
  name: string;
  type: LocationType;
  parentId: string | null;
  description: string | null;
  planPath: string | null;
  planMimetype: string | null;
  planOriginalName: string | null;
  latitude: number | null;
  longitude: number | null;
  planX: number | null;
  planY: number | null;
  createdAt: string;
};

/**
 * Returns the nearest location of type "floor" at or above `startId` in the
 * hierarchy (checks `startId` itself first, then walks up via parentId).
 */
export const findAncestorFloor = (
  locations: Location[],
  startId: string | null | undefined,
): Location | undefined => {
  let current = locations.find((l) => l.id === startId);
  while (current) {
    if (current.type === "floor") return current;
    current = locations.find((l) => l.id === current!.parentId);
  }
  return undefined;
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
  latitude?: number | null;
  longitude?: number | null;
  planX?: number | null;
  planY?: number | null;
}): Promise<Location> => {
  const { data } = await api.post("/locations", payload);
  return data;
};

export const updateLocation = async (
  id: string,
  payload: Partial<{
    name: string;
    type: LocationType;
    parentId: string | null;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    planX: number | null;
    planY: number | null;
  }>,
): Promise<Location> => {
  const { data } = await api.patch(`/locations/${id}`, payload);
  return data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};

export const uploadLocationPlan = async (id: string, file: File): Promise<Location> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/locations/${id}/plan`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const fetchLocationPlanBlob = async (id: string): Promise<string> => {
  const { data } = await api.get(`/locations/${id}/plan`, {
    responseType: "blob",
  });
  return URL.createObjectURL(data);
};

export type LocationSummaryEntry = { id: string; name: string };

export type LocationSummary = {
  location: Location;
  children: LocationTree[];
  deviceCount: number;
  devices: LocationSummaryEntry[];
  userCount: number;
  users: LocationSummaryEntry[];
};

export const getLocationSummary = async (id: string): Promise<LocationSummary> => {
  const { data } = await api.get(`/locations/${id}/summary`);
  return data;
};
