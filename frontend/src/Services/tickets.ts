import api from "../lib/api";
import type { Ticket, UpdateTicketData, Comment, Approval, ApprovalDecision, TicketType, TicketPriority, TicketImpact, TicketUrgency } from "../Types";

export const getTickets = async (query: string): Promise<{ data: Ticket[]; total: number }> => {
  const { data } = await api.get(`/tickets?${query}`);
  return data;
};

export type TicketCategoryMap = {
  Incident: string[];
  Service: string[];
};

export const getMyTickets = async (
  scope: "open" | "closed" = "open",
): Promise<Ticket[]> => {
  const { data } = await api.get(`/tickets/mine?scope=${scope}`);
  return data;
};

export const getTicketCategories = async (): Promise<TicketCategoryMap> => {
  const { data } = await api.get(`/tickets/categories`);
  return data;
};

export const updateTicketCategories = async (
  value: TicketCategoryMap,
): Promise<TicketCategoryMap> => {
  const { data } = await api.patch(`/tickets/categories`, value);
  return data;
};

export type CreateTicketPayload = {
  type: TicketType;
  description: string;
  requesterId: string;
  category?: string;
  deviceId?: string;
  assignmentGroup?: string;
  priority?: TicketPriority;
  impact?: TicketImpact;
  urgency?: TicketUrgency;
};

export const createTicket = async (
  payload: CreateTicketPayload,
): Promise<Ticket> => {
  const { data } = await api.post(`/tickets`, payload);
  return data;
};

export const getTicketsFilters = async (): Promise<Record<string, string[]>> => {
  const { data } = await api.get(`/tickets/filters`);
  return data;
};

export const searchTickets = async (search: string): Promise<Ticket[]> => {
  const { data } = await api.get(`/tickets?search=${encodeURIComponent(search)}&limit=10`);
  return data.data;
};

export const getTicket = async (id: string): Promise<Ticket> => {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
};

export const updateTicket = async (id: string, data: UpdateTicketData): Promise<Ticket> => {
  const { data: result } = await api.patch(`/tickets/${id}`, data);
  return result;
};

export const createComment = async (
  id: string,
  authorId: string,
  data: { content: string; type?: string },
): Promise<Comment> => {
  const { data: result } = await api.post(
    `/tickets/comment/${id}/${authorId}`,
    data,
  );
  return result;
};

export const createCommentWithAttachment = async (
  id: string,
  authorId: string,
  data: { content?: string; type?: string; file: File },
): Promise<Comment> => {
  const formData = new FormData();
  formData.append("file", data.file, data.file.name);
  if (data.content) formData.append("content", data.content);
  if (data.type) formData.append("type", data.type);

  const { data: result } = await api.post(
    `/tickets/comment/${id}/${authorId}/attachment`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return result;
};

export const getAttachmentUrl = (commentId: string): string => {
  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}/tickets/attachment/${commentId}`;
};

export const fetchAttachmentBlob = async (commentId: string): Promise<string> => {
  const { data } = await api.get(`/tickets/attachment/${commentId}`, {
    responseType: "blob",
  });
  return URL.createObjectURL(data);
};

export const createApproval = async (
  ticketId: string,
  requesterId: string,
  approverId: string,
): Promise<Approval> => {
  const { data } = await api.post(
    `/tickets/approve/${ticketId}/${requesterId}/${approverId}`,
  );
  return data;
};

export const updateApproval = async (
  ticketId: string,
  data: { decision: ApprovalDecision },
): Promise<Approval> => {
  const { data: result } = await api.patch(
    `/tickets/approve/${ticketId}`,
    data,
  );
  return result;
};
