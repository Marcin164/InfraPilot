import axios from "axios";

export const getCalendar = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/sla/calendars`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const postCalendar = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/sla/calendars`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const patchCalendar = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/sla/calendars/${data.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const postCalendarHoliday = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/sla/calendars/${data.id}/holidays`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const deleteCalendarHoliday = async (token: any, id: string) => {
  try {
    const result = await axios({
      method: "delete",
      url: `http://localhost:3000/sla/calendars/${id}/holidays`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getSlaDefinitions = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/sla/definitions`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const postSlaDefinition = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/sla/definitions`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const patchSlaDefinition = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/sla/definitions/${data.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const deleteSlaDefinition = async (token: any, id: string) => {
  try {
    const result = await axios({
      method: "delete",
      url: `http://localhost:3000/sla/definitions/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getSlaRules = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/sla/rules`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const postSlaRule = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/sla/rules`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const patchSlaRule = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/sla/rules/${data.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const deleteSlaRule = async (token: any, id: string) => {
  try {
    const result = await axios({
      method: "delete",
      url: `http://localhost:3000/sla/rules/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getSlaEscalations = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/sla/escalations/definitions`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    console.log(result.data);
    return result.data;
  } catch (error) {
    return error;
  }
};

export const postSlaEscalation = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: `http://localhost:3000/sla/escalations`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const patchSlaEscalation = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "patch",
      url: `http://localhost:3000/sla/escalations/${data.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const deleteSlaEscalation = async (token: any, id: string) => {
  try {
    const result = await axios({
      method: "delete",
      url: `http://localhost:3000/sla/escalations/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getTicketSla = async (token: any, ticketId: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/sla/ticket/${ticketId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
