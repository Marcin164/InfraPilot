import api from "../lib/api";

export const getCalendar = async () => {
  const { data } = await api.get("/sla/calendars");
  return data;
};

export const postCalendar = async (data: any) => {
  const { data: result } = await api.post("/sla/calendars", data);
  return result;
};

export const patchCalendar = async (data: any) => {
  const { data: result } = await api.patch(`/sla/calendars/${data.id}`, data);
  return result;
};

export const postCalendarHoliday = async (data: any) => {
  const { data: result } = await api.post(
    `/sla/calendars/${data.id}/holidays`,
    data,
  );
  return result;
};

export const deleteCalendarHoliday = async (id: string) => {
  const { data } = await api.delete(`/sla/calendars/${id}/holidays`);
  return data;
};

export const getSlaDefinitions = async () => {
  const { data } = await api.get("/sla/definitions");
  return data;
};

export const postSlaDefinition = async (data: any) => {
  const { data: result } = await api.post("/sla/definitions", data);
  return result;
};

export const patchSlaDefinition = async (data: any) => {
  const { data: result } = await api.patch(
    `/sla/definitions/${data.id}`,
    data,
  );
  return result;
};

export const deleteSlaDefinition = async (id: string) => {
  const { data } = await api.delete(`/sla/definitions/${id}`);
  return data;
};

export const getSlaRules = async () => {
  const { data } = await api.get("/sla/rules");
  return data;
};

export const postSlaRule = async (data: any) => {
  const { data: result } = await api.post("/sla/rules", data);
  return result;
};

export const patchSlaRule = async (data: any) => {
  const { data: result } = await api.patch(`/sla/rules/${data.id}`, data);
  return result;
};

export const deleteSlaRule = async (id: string) => {
  const { data } = await api.delete(`/sla/rules/${id}`);
  return data;
};

export const getSlaEscalations = async () => {
  const { data } = await api.get("/sla/escalations/definitions");
  return data;
};

export const postSlaEscalation = async (data: any) => {
  const { data: result } = await api.post("/sla/escalations", data);
  return result;
};

export const patchSlaEscalation = async (data: any) => {
  const { data: result } = await api.patch(
    `/sla/escalations/${data.id}`,
    data,
  );
  return result;
};

export const deleteSlaEscalation = async (id: string) => {
  const { data } = await api.delete(`/sla/escalations/${id}`);
  return data;
};

export const getTicketSla = async (ticketId: string) => {
  const { data } = await api.get(`/sla/ticket/${ticketId}`);
  return data;
};
