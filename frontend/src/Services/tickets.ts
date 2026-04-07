import api from "../lib/api";
import type { Ticket, UpdateTicketData, Comment, Approval, ApprovalDecision } from "../Types";

export const getTickets = async (query: string): Promise<{ data: Ticket[]; total: number }> => {
  const { data } = await api.get(`/tickets?${query}`);
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
