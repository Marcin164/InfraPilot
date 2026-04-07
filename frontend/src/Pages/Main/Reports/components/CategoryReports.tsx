import React from "react";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "./PageContainer";
import GenericReport from "./GenericReport";
import {
  listReports,
  type ReportCategory,
  type ReportMeta,
} from "../../../../Services/reports";

type Props = {
  categories: ReportCategory[];
};

const CategoryReports = ({ categories }: Props) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageContainer>Loading reports…</PageContainer>;
  if (error || !data)
    return <PageContainer>Failed to load reports list</PageContainer>;

  const filtered: ReportMeta[] = data.filter((r) =>
    categories.includes(r.category)
  );

  return (
    <PageContainer>
      {filtered.map((meta) => (
        <GenericReport key={meta.key} meta={meta} />
      ))}
    </PageContainer>
  );
};

export default CategoryReports;
