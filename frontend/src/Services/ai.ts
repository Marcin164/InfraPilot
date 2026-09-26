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

// Every place in the app that can call into AI. Each is an independent
// on/off switch configurable in Settings > AI -- see aiSettings.service.ts
// on the backend for the source of truth.
export type AiSurface =
  | "adminTicketAssist"
  | "userTicketAssist"
  | "logAnalysis"
  | "ticketClosureSummary";

export const ALL_AI_SURFACES: AiSurface[] = [
  "adminTicketAssist",
  "userTicketAssist",
  "logAnalysis",
  "ticketClosureSummary",
];

export const AI_MODEL_OPTIONS = [
  "gpt-6-astra",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
] as const;

export type AiConfig = {
  model: string;
  enabledSurfaces: AiSurface[];
  knowledgeSpaceId: string;
};

export const ticketAssist = async (payload: {
  description: string;
  category?: string;
  deviceInfo?: string;
  surface: "adminTicketAssist" | "userTicketAssist";
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

// Readable by any authenticated user -- both admin panels and the end-user
// portal need to know whether their own surface is enabled before deciding
// to render their AI button.
export const getAiSettings = async (): Promise<AiConfig> => {
  const { data } = await api.get("/ai/settings");
  return data;
};

export const saveAiSettings = async (
  payload: Partial<AiConfig>,
): Promise<AiConfig> => {
  const { data } = await api.put("/ai/settings", payload);
  return data;
};
