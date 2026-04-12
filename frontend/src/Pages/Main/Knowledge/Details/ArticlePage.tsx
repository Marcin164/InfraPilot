import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faPen,
  faSave,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import {
  getArticle,
  getSpace,
  updateArticle,
  deleteArticle,
  getCategoriesBySpace,
} from "../../../../Services/knowledge";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import { useParser } from "../../../../Hooks/useParser";
import type { ArticleStatus } from "../../../../Types";

const statusColor: Record<string, string> = {
  draft: "bg-[#F1C40F] text-[#3C3C3C]",
  published: "bg-[#2ECC71] text-white",
  archived: "bg-[#8A8A8A] text-white",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ArticlePage = () => {
  const { id: spaceId, articleId } = useParams<{
    id: string;
    articleId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setParsers } = useParser();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState<ArticleStatus>("draft");
  const [editTags, setEditTags] = useState("");

  const spaceQuery = useQuery({
    queryKey: ["knowledge-space", spaceId],
    queryFn: () => getSpace(spaceId!),
    enabled: Boolean(spaceId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["knowledge-categories", spaceId],
    queryFn: () => getCategoriesBySpace(spaceId!),
    enabled: Boolean(spaceId),
  });

  const articleQuery = useQuery({
    queryKey: ["knowledge-article", articleId],
    queryFn: () => getArticle(articleId!),
    enabled: Boolean(articleId),
  });

  const article = articleQuery.data;
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    const map: Record<string, string> = {};
    if (spaceQuery.data?.id) map[spaceQuery.data.id] = spaceQuery.data.name;
    if (article?.id) map[article.id] = article.title;
    // resolve "article" path segment
    map["article"] = "Article";
    if (Object.keys(map).length) setParsers(map);
    return () => setParsers({});
  }, [spaceQuery.data?.id, article?.id, article?.title, setParsers]);

  const startEditing = () => {
    if (!article) return;
    setEditTitle(article.title);
    setEditContent(article.content ?? "");
    setEditCategory(article.category ?? "");
    setEditStatus(article.status);
    setEditTags((article.tags ?? []).join(", "));
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateArticle(articleId!, {
        title: editTitle.trim(),
        content: editContent,
        category: editCategory.trim() || null,
        status: editStatus,
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-article", articleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-articles", spaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-categories", spaceId],
      });
      toast.success("Article saved");
      setEditing(false);
    },
    onError: () => {
      toast.error("Failed to save article");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(articleId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-articles", spaceId],
      });
      toast.success("Article deleted");
      navigate(`/knowledge/${spaceId}`);
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  if (articleQuery.isLoading) {
    return <div className="p-6 text-[#535353]">Loading…</div>;
  }

  if (articleQuery.isError || !article) {
    return (
      <div className="p-6">
        <div className="rounded-[10px] bg-white p-6 shadow-xl text-[#BC0E0E]">
          Article not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 pb-4">
        <Link
          to={`/knowledge/${spaceId}`}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white text-[#535353] shadow-xl hover:bg-[#F0F0F0]"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>

        <div className="flex items-center gap-2">
          {!editing && (
            <ButtonPrimary
              color="white"
              icon={faPen}
              text="Edit"
              onClick={startEditing}
            />
          )}
          {editing && (
            <>
              <ButtonPrimary
                color="blue"
                icon={faSave}
                text={saveMutation.isPending ? "Saving…" : "Save"}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editTitle.trim()}
              />
              <ButtonPrimary
                color="white"
                icon={faXmark}
                text="Cancel"
                onClick={cancelEditing}
              />
            </>
          )}
          <ButtonPrimary
            color="red"
            icon={faTrash}
            onClick={() => {
              if (confirm("Delete this article?")) deleteMutation.mutate();
            }}
          />
        </div>
      </div>

      {/* View mode */}
      {!editing && (
        <div className="rounded-[10px] bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-[28px] font-bold text-[#3C3C3C]">
              {article.title}
            </h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold uppercase ${statusColor[article.status] ?? ""}`}
            >
              {article.status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-[#8A8A8A]">
            {article.author && (
              <span className="font-semibold text-[#3C3C3C]">
                {article.author.distinguishedName}
              </span>
            )}
            {article.space && (
              <span>
                Space:{" "}
                <Link
                  to={`/knowledge/${article.spaceId}`}
                  className="text-[#2B9AE9] hover:underline"
                >
                  {article.space.name}
                </Link>
              </span>
            )}
            <span>Updated {formatDate(article.updatedAt)}</span>
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faEye} className="text-[11px]" />
              {article.views}
            </span>
          </div>

          {(article.category || (article.tags && article.tags.length > 0)) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.category && (
                <span className="rounded-full bg-[#E6F4FF] px-2 py-[2px] text-[12px] font-bold text-[#2B9AE9]">
                  {article.category}
                </span>
              )}
              {(article.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#F5F5F5] px-2 py-[2px] text-[12px] text-[#535353]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <hr className="my-4 border-[#E0E0E0]" />

          <div className="prose max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-[#3C3C3C]">
            {article.content || (
              <span className="italic text-[#8A8A8A]">No content yet.</span>
            )}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="rounded-[10px] bg-white p-6 shadow-xl">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e: any) => setEditTitle(e.target.value)}
          />

          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">Content</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="mt-[6px] w-full rounded-[10px] border border-[#535353] bg-white px-3 py-2 text-[15px] leading-relaxed text-[#3C3C3C] outline-none focus:border-[#2B9AE9] resize-y"
              placeholder="Write your article content here..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Category"
              value={editCategory}
              onChange={(e: any) => setEditCategory(e.target.value)}
            />
            <Input
              label="Tags (comma-separated)"
              value={editTags}
              onChange={(e: any) => setEditTags(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">Status</label>
            <div className="mt-[6px] flex gap-2">
              {(["draft", "published", "archived"] as ArticleStatus[]).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStatus(s)}
                    className={`cursor-pointer rounded-[10px] px-4 py-2 text-[14px] font-bold capitalize transition ${
                      editStatus === s
                        ? "bg-[#2B9AE9] text-white"
                        : "border border-[#535353] bg-white text-[#535353]"
                    }`}
                  >
                    {s}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlePage;
