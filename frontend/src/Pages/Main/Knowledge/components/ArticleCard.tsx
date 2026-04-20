import { Link } from "react-router";
import type { KnowledgeArticle } from "../../../../Types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

type Props = { article: KnowledgeArticle };

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
  });
};

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const ArticleCard = ({ article }: Props) => {
  const plain = stripHtml(article.content ?? "");
  const preview = plain.slice(0, 120);

  return (
    <Link
      to={`/admin/knowledge/${article.spaceId}/${article.id}`}
      className="flex flex-col rounded-[10px] bg-white p-4 shadow-xl transition hover:shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[16px] font-bold text-[#3C3C3C] line-clamp-2">
          {article.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-[2px] text-[11px] font-bold uppercase ${statusColor[article.status] ?? ""}`}
        >
          {article.status}
        </span>
      </div>

      {preview && (
        <p className="mt-2 text-[13px] leading-relaxed text-[#535353] line-clamp-3">
          {preview}
          {plain.length > 120 && "…"}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[12px] text-[#8A8A8A]">
        <span>{formatDate(article.updatedAt)}</span>
        <div className="flex items-center gap-3">
          {article.author && (
            <span className="font-semibold text-[#3C3C3C]">
              {article.author.distinguishedName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faEye} className="text-[11px]" />
            {article.views}
          </span>
        </div>
      </div>

      {article.category && (
        <div className="mt-2">
          <span className="rounded-full bg-[#E6F4FF] px-2 py-[2px] text-[11px] font-bold text-[#2B9AE9]">
            {article.category}
          </span>
        </div>
      )}
    </Link>
  );
};

export default ArticleCard;
