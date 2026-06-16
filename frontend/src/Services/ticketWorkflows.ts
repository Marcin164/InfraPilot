import api from "../lib/api";

export type WorkflowStepType =
  | "request_approval"
  | "notify"
  | "set_field"
  | "assign_to"
  | "create_comment";

export type WorkflowStep = {
  id: string;
  order: number;
  type: WorkflowStepType;
  label?: string;
  config: Record<string, any>;
};

export type TicketWorkflow = {
  id: string;
  name: string;
  description: string | null;
  trigger: "on_create" | "on_state_change" | "on_assign" | "on_priority_change" | "on_close";
  enabled: boolean;
  steps: WorkflowStep[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketCategory = {
  id: string;
  name: string;
  ticketType: "Incident" | "Service" | null;
  description: string | null;
  color: string;
  enabled: boolean;
  workflowId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const listWorkflows = async (): Promise<TicketWorkflow[]> => {
  const { data } = await api.get("/ticket-workflows");
  return data;
};

export const getWorkflow = async (id: string): Promise<TicketWorkflow> => {
  const { data } = await api.get(`/ticket-workflows/${id}`);
  return data;
};

export const upsertWorkflow = async (
  input: Partial<TicketWorkflow> & { name: string; steps: WorkflowStep[] },
): Promise<TicketWorkflow> => {
  const { data } = await api.put("/ticket-workflows", input);
  return data;
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  await api.delete(`/ticket-workflows/${id}`);
};

export const listTicketCategories = async (): Promise<TicketCategory[]> => {
  const { data } = await api.get("/ticket-workflows/categories");
  return data;
};

export const upsertTicketCategory = async (
  input: Partial<TicketCategory> & { name: string },
): Promise<TicketCategory> => {
  const { data } = await api.put("/ticket-workflows/categories", input);
  return data;
};

export const deleteTicketCategory = async (id: string): Promise<void> => {
  await api.delete(`/ticket-workflows/categories/${id}`);
};
