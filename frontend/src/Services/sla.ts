import api from "../lib/api";
import type {
  SlaCalendar,
  SlaHoliday,
  SlaDefinition,
  SlaRule,
  SlaEscalation,
  TicketSla,
} from "../Types";

export const getCalendar = async (): Promise<SlaCalendar[]> => {
  const { data } = await api.get("/sla/calendars");
  return data;
};

export const postCalendar = async (data: Omit<SlaCalendar, "id" | "holidays">): Promise<SlaCalendar> => {
  const { data: result } = await api.post("/sla/calendars", data);
  return result;
};

export const patchCalendar = async (data: Partial<SlaCalendar> & { id: string }): Promise<SlaCalendar> => {
  const { data: result } = await api.patch(`/sla/calendars/${data.id}`, data);
  return result;
};

export const postCalendarHoliday = async (data: SlaHoliday & { id: string }): Promise<SlaHoliday> => {
  const { data: result } = await api.post(
    `/sla/calendars/${data.id}/holidays`,
    data,
  );
  return result;
};

export const deleteCalendarHoliday = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/sla/calendars/${id}/holidays`);
  return data;
};

export const getSlaDefinitions = async (): Promise<SlaDefinition[]> => {
  const { data } = await api.get("/sla/definitions");
  return data;
};

export const postSlaDefinition = async (data: Omit<SlaDefinition, "id">): Promise<SlaDefinition> => {
  const { data: result } = await api.post("/sla/definitions", data);
  return result;
};

export const patchSlaDefinition = async (data: Partial<SlaDefinition> & { id: string }): Promise<SlaDefinition> => {
  const { data: result } = await api.patch(
    `/sla/definitions/${data.id}`,
    data,
  );
  return result;
};

export const deleteSlaDefinition = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/sla/definitions/${id}`);
  return data;
};

export const getSlaRules = async (): Promise<SlaRule[]> => {
  const { data } = await api.get("/sla/rules");
  return data;
};

export const postSlaRule = async (data: Omit<SlaRule, "id">): Promise<SlaRule> => {
  const { data: result } = await api.post("/sla/rules", data);
  return result;
};

export const patchSlaRule = async (data: Partial<SlaRule> & { id: string }): Promise<SlaRule> => {
  const { data: result } = await api.patch(`/sla/rules/${data.id}`, data);
  return result;
};

export const deleteSlaRule = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/sla/rules/${id}`);
  return data;
};

export const getSlaEscalations = async (): Promise<SlaEscalation[]> => {
  const { data } = await api.get("/sla/escalations/definitions");
  return data;
};

export const postSlaEscalation = async (data: Omit<SlaEscalation, "id">): Promise<SlaEscalation> => {
  const { data: result } = await api.post("/sla/escalations", data);
  return result;
};

export const patchSlaEscalation = async (data: Partial<SlaEscalation> & { id: string }): Promise<SlaEscalation> => {
  const { data: result } = await api.patch(
    `/sla/escalations/${data.id}`,
    data,
  );
  return result;
};

export const deleteSlaEscalation = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/sla/escalations/${id}`);
  return data;
};

export const getTicketSla = async (ticketId: string): Promise<TicketSla> => {
  const { data } = await api.get(`/sla/ticket/${ticketId}`);
  return data;
};
