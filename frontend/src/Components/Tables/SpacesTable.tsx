import React from "react";
import { useTranslation } from "react-i18next";
import MainTable from "./MainTable";
import { useNavigate } from "react-router-dom";
import type { KnowledgeSpace } from "../../Types";

type Props = {
  data: KnowledgeSpace[];
  isLoading: boolean;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const SpacesTable = ({ data, isLoading }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = [
    {
      cell: (row: KnowledgeSpace) => (
        <div className="w-[40px] h-[40px] flex items-center justify-center rounded-[10px] bg-[#E6F4FF] text-xl">
          {row.icon || "📚"}
        </div>
      ),
      width: "70px",
    },
    {
      name: t("spaces.column.name"),
      cell: (row: KnowledgeSpace) => (
        <div className="font-bold">{row.name}</div>
      ),
      width: "260px",
    },
    {
      name: t("spaces.column.description"),
      cell: (row: KnowledgeSpace) => (
        <div className="truncate text-gray-600">
          {row.description || "-"}
        </div>
      ),
      grow: 2,
    },
    {
      name: t("spaces.column.articles"),
      cell: (row: KnowledgeSpace) => (
        <div>{row.articles?.length ?? 0}</div>
      ),
      width: "110px",
    },
    {
      name: t("spaces.column.author"),
      cell: (row: KnowledgeSpace) => (
        <div>{row.author?.distinguishedName || "-"}</div>
      ),
      width: "220px",
    },
    {
      name: t("spaces.column.created"),
      cell: (row: KnowledgeSpace) => <div>{formatDate(row.createdAt)}</div>,
      width: "130px",
    },
    {
      name: t("spaces.column.updated"),
      cell: (row: KnowledgeSpace) => <div>{formatDate(row.updatedAt)}</div>,
      width: "130px",
    },
  ];

  if (isLoading) return <div>{t("common.loading2")}</div>;

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: KnowledgeSpace) => navigate(`/admin/knowledge/${row.id}`)}
      className="h-[calc(100vh-170px)]"
    />
  );
};

export default SpacesTable;
