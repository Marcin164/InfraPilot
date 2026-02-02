import axios from "axios";

export const getTickets = async (token: any, query: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/tickets?${query}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getTicket = async (token: any, id: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/tickets/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const updateTicket = async (token: any, id: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/tickets/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const createComment = async (
  token: any,
  id: any,
  authorId: any,
  data: any,
) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/tickets/comment/${id}/${authorId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const createApproval = async (
  token: any,
  ticketId: any,
  requesterId: any,
  approverId: any,
) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/tickets/approve/${ticketId}/${requesterId}/${approverId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const updateApproval = async (token: any, ticketId: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/tickets/approve/${ticketId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
