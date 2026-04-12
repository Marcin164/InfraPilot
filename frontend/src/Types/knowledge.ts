export type ArticleStatus = "draft" | "published" | "archived";

export interface KnowledgeSpace {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  authorId: string | null;
  author?: { id: string; distinguishedName: string };
  articles?: KnowledgeArticle[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string | null;
  status: ArticleStatus;
  spaceId: string;
  space?: { id: string; name: string };
  authorId: string | null;
  author?: { id: string; distinguishedName: string };
  category: string | null;
  tags: string[] | null;
  ticketId: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
}
