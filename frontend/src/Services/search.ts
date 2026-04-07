import api from "../lib/api";

export type SearchResultItem = {
  id: string;
  type: "user" | "device" | "ticket" | "history" | "report" | "setting";
  title: string;
  subtitle?: string;
  url: string;
};

export type SearchResults = {
  users: SearchResultItem[];
  devices: SearchResultItem[];
  tickets: SearchResultItem[];
  histories: SearchResultItem[];
};

export const globalSearch = async (q: string): Promise<SearchResults> => {
  const { data } = await api.get("/search", { params: { q } });
  return data;
};
