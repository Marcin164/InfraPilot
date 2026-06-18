import api from "../lib/api";

export type AgentTaskType =
  | "scan_now"
  | "collect_event_log"
  | "inventory_refresh";

export type AgentTaskState =
  | "queued"
  | "leased"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export type AgentTask = {
  id: string;
  deviceId: string;
  type: AgentTaskType;
  payload: Record<string, any> | null;
  state: AgentTaskState;
  leasedAt: string | null;
  leasedUntil: string | null;
  completedAt: string | null;
  result: Record<string, any> | null;
  attempts: number;
  lastError: string | null;
  requestedBy: string | null;
  createdAt: string;
};

export const listDeviceTasks = async (
  deviceId: string,
  state?: AgentTaskState,
): Promise<AgentTask[]> => {
  const { data } = await api.get(`/devices/${deviceId}/tasks`, {
    params: state ? { state } : undefined,
  });
  return data;
};

export const enqueueDeviceTask = async (
  deviceId: string,
  body: { type: AgentTaskType; payload?: Record<string, any> },
): Promise<AgentTask> => {
  const { data } = await api.post(`/devices/${deviceId}/tasks`, body);
  return data;
};

export const enqueueBulkTasks = async (body: {
  deviceIds: string[];
  type: AgentTaskType;
  payload?: Record<string, any>;
}): Promise<{ created: number }> => {
  const { data } = await api.post(`/devices/bulk/tasks`, body);
  return data;
};

export const cancelDeviceTask = async (taskId: string): Promise<AgentTask> => {
  const { data } = await api.post(`/devices/tasks/${taskId}/cancel`);
  return data;
};
