import api from "../lib/api";

export type TicketTemplate = {
  id: string;
  name: string;
  body: string;
  category: string;
  shared: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const listTicketTemplates = async (): Promise<TicketTemplate[]> => {
  const { data } = await api.get("/ticket-templates");
  return data;
};

export const createTicketTemplate = async (input: {
  name: string;
  body: string;
  category?: string;
  shared?: boolean;
}): Promise<TicketTemplate> => {
  const { data } = await api.post("/ticket-templates", input);
  return data;
};

export const updateTicketTemplate = async (
  id: string,
  patch: Partial<TicketTemplate>,
): Promise<TicketTemplate> => {
  const { data } = await api.patch(`/ticket-templates/${id}`, patch);
  return data;
};

export const deleteTicketTemplate = async (id: string): Promise<void> => {
  await api.delete(`/ticket-templates/${id}`);
};

/**
 * Replace `{path.subpath}` placeholders from a shallow context.
 * Missing keys stay as-is so the agent notices and fills them in.
 */
export const substituteTemplate = (
  body: string,
  context: Record<string, any>,
): string =>
  body.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, path) => {
    const parts = path.split(".");
    let cur: any = context;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return match;
      cur = cur[p];
    }
    return cur == null || cur === "" ? match : String(cur);
  });
