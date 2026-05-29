import api from "../lib/api";

export type MaintenanceType = "scheduled" | "repair" | "inspection" | "upgrade" | "other";

export type MaintenanceRecord = {
  id: string;
  deviceId: string;
  type: MaintenanceType;
  description: string | null;
  performedBy: string | null;
  cost: number | null;
  currency: string | null;
  performedAt: string | null;
  nextDueAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type CreateMaintenanceDto = {
  deviceId: string;
  type?: MaintenanceType;
  description?: string;
  performedBy?: string;
  cost?: number | string;
  currency?: string;
  performedAt?: string;
  nextDueAt?: string;
  notes?: string;
};

export const getDeviceMaintenance = async (deviceId: string): Promise<MaintenanceRecord[]> => {
  const { data } = await api.get(`/maintenance/device/${deviceId}`);
  return data;
};

export const createMaintenance = async (dto: CreateMaintenanceDto): Promise<MaintenanceRecord> => {
  const { data } = await api.post("/maintenance", dto);
  return data;
};

export const updateMaintenance = async (id: string, dto: Partial<CreateMaintenanceDto>): Promise<MaintenanceRecord> => {
  const { data } = await api.patch(`/maintenance/${id}`, dto);
  return data;
};

export const deleteMaintenance = async (id: string): Promise<void> => {
  await api.delete(`/maintenance/${id}`);
};
