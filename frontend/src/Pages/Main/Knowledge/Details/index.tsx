import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { faPlus, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getSpace,
  getArticlesBySpace,
  getCategoriesBySpace,
} from "../../../../Services/knowledge";
import Search from "../../../../Components/Inputs/Search";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { useDebounce } from "../../../../Hooks/useDebounce";
import { useParser } from "../../../../Hooks/useParser";
import AddArticleModal from "../components/AddArticleModal";
import ArticleCard from "../components/ArticleCard";
import PageMotion from "../../../../Components/PageMotion/PageMotion";
import { motion } from "framer-motion";

const KnowledgeDetails = () => {
  const { t } = useTranslation();
  const { id: spaceId } = useParams<{ id: string }>();
  const { setParsers } = useParser();

  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const spaceQuery = useQuery({
    queryKey: ["knowledge-space", spaceId],
    queryFn: () => getSpace(spaceId!),
    enabled: Boolean(spaceId),
  });

  const articlesQuery = useQuery({
    queryKey: ["knowledge-articles", spaceId, activeCategory],
    queryFn: () =>
      getArticlesBySpace(spaceId!, activeCategory ?? undefined),
    enabled: Boolean(spaceId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["knowledge-categories", spaceId],
    queryFn: () => getCategoriesBySpace(spaceId!),
    enabled: Boolean(spaceId),
  });

  useEffect(() => {
    if (spaceQuery.data?.id) {
      setParsers({ [spaceQuery.data.id]: spaceQuery.data.name });
    }
    return () => setParsers({});
  }, [spaceQuery.data?.id, setParsers]);

  const articles = useMemo(() => {
    const list = articlesQuery.data ?? [];
    if (!debouncedSearch.trim()) return list;
    const q = debouncedSearch.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.content ?? "").toLowerCase().includes(q),
    );
  }, [articlesQuery.data, debouncedSearch]);

  const space = spaceQuery.data;
  const categories = categoriesQuery.data ?? [];

  if (spaceQuery.isLoading) {
    return <div className="p-6 text-[#535353]">{t("history.loading")}</div>;
  }

  return (
    <PageMotion>
    <div className="h-[calc(100vh-58px)] w-full px-4">
      <div className="flex items-center gap-3 pt-4 pb-2">
        <Link
          to="/admin/knowledge"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white text-[#535353] shadow-xl hover:bg-[#F0F0F0]"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        <span className="text-2xl">
          {space?.icon || "📚"}
        </span>
        <h1 className="text-[24px] font-bold text-[#3C3C3C]">
          {space?.name ?? t("knowledge.spaceFallback")}
        </h1>
      </div>

      {space?.description && (
        <p className="px-1 pb-2 text-[14px] text-[#535353]">
          {space.description}
        </p>
      )}

      <div className="flex items-center gap-2 pb-4">
        <Search
          onChange={(e: any) => setSearchValue(e.target.value)}
        />
        <ButtonPrimary
          color="white"
          icon={faPlus}
          text={t("btn.add.article")}
          onClick={() => setIsAddModalOpen(true)}
          className="h-[34px] ml-2"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`cursor-pointer rounded-full px-3 py-1 text-[13px] font-bold transition ${
              activeCategory === null
                ? "bg-[#2B9AE9] text-white"
                : "bg-white text-[#535353] shadow-xl hover:bg-[#F0F0F0]"
            }`}
          >
            {t("knowledge.all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => setActiveCategory(cat.category)}
              className={`cursor-pointer rounded-full px-3 py-1 text-[13px] font-bold transition ${
                activeCategory === cat.category
                  ? "bg-[#2B9AE9] text-white"
                  : "bg-white text-[#535353] shadow-xl hover:bg-[#F0F0F0]"
              }`}
            >
              {cat.category}{" "}
              <span className="font-normal opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      )}

      {articlesQuery.isLoading && (
        <div className="text-[#535353]">{t("knowledge.loadingArticles")}</div>
      )}

      {!articlesQuery.isLoading && articles.length === 0 && (
        <div className="rounded-[10px] bg-white p-6 text-center text-[#535353] shadow-xl">
          {t("knowledge.empty")}
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.05 }}
      >
        {articles.map((article) => (
          <motion.div
            key={article.id}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
            }}
          >
            <ArticleCard article={article} />
          </motion.div>
        ))}
      </motion.div>

      {spaceId && (
        <AddArticleModal
          spaceId={spaceId}
          isModalOpen={isAddModalOpen}
          onCloseModal={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
    </PageMotion>
  );
};

export default KnowledgeDetails;
