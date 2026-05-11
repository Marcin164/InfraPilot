import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "./PageContainer";
import GenericReport from "./GenericReport";
import {
  getReportsBatch,
  listReports,
  type ReportCategory,
  type ReportMeta,
} from "../../../../Services/reports";

type Props = {
  categories: ReportCategory[];
};

const CategoryReports = ({ categories }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    staleTime: 5 * 60 * 1000,
  });

  const filtered: ReportMeta[] = (data ?? []).filter((r) =>
    categories.includes(r.category)
  );

  const keys = filtered.map((m) => m.key);
  const keysSignature = keys.join(",");

  const { data: batchData, isLoading: isBatchLoading } = useQuery({
    queryKey: ["reports", "batch", keysSignature],
    queryFn: () => getReportsBatch(keys),
    enabled: keys.length > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!batchData) return;
    for (const [key, value] of Object.entries(batchData)) {
      queryClient.setQueryData(["reports", key, {}], value);
    }
  }, [batchData, queryClient]);

  if (isLoading) return <PageContainer>{t("reports.loading")}</PageContainer>;
  if (error || !data)
    return <PageContainer>{t("reports.loadingFailed")}</PageContainer>;
  if (isBatchLoading) return <PageContainer>{t("reports.loading")}</PageContainer>;

  return (
    <PageContainer>
      {filtered.map((meta) => (
        <GenericReport key={meta.key} meta={meta} />
      ))}
    </PageContainer>
  );
};

export default CategoryReports;
