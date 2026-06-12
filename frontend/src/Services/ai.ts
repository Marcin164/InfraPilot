import api from "../lib/api";

export interface TicketAssistResult {
  title: string;
  improvedDescription: string;
  solutions: string[];
}

export interface LogAnalysisResult {
  summary: string;
  issues: string[];
  recommendations: string[];
}

export const ticketAssist = async (payload: {
  description: string;
  category?: string;
  deviceInfo?: string;
}): Promise<TicketAssistResult> => {
  const { data } = await api.post("/ai/ticket-assist", payload);
  return data;
};

export const analyzeLogs = async (payload: {
  logs: any;
  description?: string;
}): Promise<LogAnalysisResult> => {
  const { data } = await api.post("/ai/analyze-logs", payload);
  return data;
};
