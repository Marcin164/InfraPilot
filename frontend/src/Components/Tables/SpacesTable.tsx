import React from "react";
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
      name: "Name",
      cell: (row: KnowledgeSpace) => (
        <div className="font-bold">{row.name}</div>
      ),
      width: "260px",
    },
    {
      name: "Description",
      cell: (row: KnowledgeSpace) => (
        <div className="truncate text-gray-600">
          {row.description || "-"}
        </div>
      ),
      grow: 2,
    },
    {
      name: "Articles",
      cell: (row: KnowledgeSpace) => (
        <div>{row.articles?.length ?? 0}</div>
      ),
      width: "110px",
    },
    {
      name: "Author",
      cell: (row: KnowledgeSpace) => (
        <div>{row.author?.distinguishedName || "-"}</div>
      ),
      width: "220px",
    },
    {
      name: "Created",
      cell: (row: KnowledgeSpace) => <div>{formatDate(row.createdAt)}</div>,
      width: "130px",
    },
    {
      name: "Updated",
      cell: (row: KnowledgeSpace) => <div>{formatDate(row.updatedAt)}</div>,
      width: "130px",
    },
  ];

  if (isLoading) return <div>loading...</div>;

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: KnowledgeSpace) => navigate(`/knowledge/${row.id}`)}
      className="h-[calc(100vh-170px)]"
    />
  );
};

export default SpacesTable;
