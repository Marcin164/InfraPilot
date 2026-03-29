import api from "../lib/api";

export const getTickets = async (query: string) => {
  const { data } = await api.get(`/tickets?${query}`);
  return data;
};

export const getTicket = async (id: string) => {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
};

export const updateTicket = async (id: string, data: any) => {
  const { data: result } = await api.patch(`/tickets/${id}`, data);
  return result;
};

export const createComment = async (
  id: string,
  authorId: string,
  data: any,
) => {
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
) => {
  const { data } = await api.post(
    `/tickets/approve/${ticketId}/${requesterId}/${approverId}`,
  );
  return data;
};

export const updateApproval = async (ticketId: string, data: any) => {
  const { data: result } = await api.patch(
    `/tickets/approve/${ticketId}`,
    data,
  );
  return result;
};
