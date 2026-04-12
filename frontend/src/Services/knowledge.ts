import api from "../lib/api";
import type { KnowledgeSpace, KnowledgeArticle } from "../Types";

// ─── Spaces ───

export const getSpaces = async (): Promise<KnowledgeSpace[]> => {
  const { data } = await api.get("/knowledge/spaces");
  return data;
};

export const getSpace = async (id: string): Promise<KnowledgeSpace> => {
  const { data } = await api.get(`/knowledge/spaces/${id}`);
  return data;
};

export const createSpace = async (
  dto: Pick<KnowledgeSpace, "name" | "description" | "icon">
): Promise<KnowledgeSpace> => {
  const { data } = await api.post("/knowledge/spaces", dto);
  return data;
};

export const updateSpace = async (
  id: string,
  dto: Partial<Pick<KnowledgeSpace, "name" | "description" | "icon">>
): Promise<KnowledgeSpace> => {
  const { data } = await api.patch(`/knowledge/spaces/${id}`, dto);
  return data;
};

export const deleteSpace = async (id: string): Promise<void> => {
  await api.delete(`/knowledge/spaces/${id}`);
};

// ─── Articles ───

export const getArticlesBySpace = async (
  spaceId: string,
  category?: string
): Promise<KnowledgeArticle[]> => {
  const { data } = await api.get(`/knowledge/articles/space/${spaceId}`, {
    params: category ? { category } : undefined,
  });
  return data;
};

export const getCategoriesBySpace = async (
  spaceId: string
): Promise<Array<{ category: string; count: number }>> => {
  const { data } = await api.get(
    `/knowledge/articles/space/${spaceId}/categories`
  );
  return data;
};

export const getArticle = async (id: string): Promise<KnowledgeArticle> => {
  const { data } = await api.get(`/knowledge/articles/${id}`);
  return data;
};

export const searchArticles = async (
  query: string
): Promise<KnowledgeArticle[]> => {
  const { data } = await api.get("/knowledge/articles/search", {
    params: { q: query },
  });
  return data;
};

export const createArticle = async (
  dto: Pick<
    KnowledgeArticle,
    "title" | "content" | "spaceId" | "status" | "category" | "tags" | "ticketId"
  >
): Promise<KnowledgeArticle> => {
  const { data } = await api.post("/knowledge/articles", dto);
  return data;
};

export const updateArticle = async (
  id: string,
  dto: Partial<
    Pick<KnowledgeArticle, "title" | "content" | "status" | "category" | "tags">
  >
): Promise<KnowledgeArticle> => {
  const { data } = await api.patch(`/knowledge/articles/${id}`, dto);
  return data;
};

export const deleteArticle = async (id: string): Promise<void> => {
  await api.delete(`/knowledge/articles/${id}`);
};
