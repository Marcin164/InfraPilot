import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const RetentionLegalHold = () => {
  const { t } = useTranslation();
  const data = useDashboardData("retention-legal-hold");

  const legalHoldsActive = data.find((d) => d.label === "legalHoldsActive")?.value ?? 0;
  const policiesNeverRun = data.find((d) => d.label === "policiesNeverRun")?.value ?? 0;
  const lastRunAffected = data.find((d) => d.label === "lastRunAffected")?.value ?? 0;

  return (
    <CardWrapper
      title={t("dashboard.widget.retentionLegalHold")}
      subtitle={t("dashboard.widget.retentionLegalHold.subtitle")}
      accent="#B0729A"
    >
      <div className="grid grid-cols-1 gap-3 w-full">
        <Cell label="Active legal holds" value={legalHoldsActive} color="#B0729A" />
        <Cell
          label="Policies never run"
          value={policiesNeverRun}
          color={policiesNeverRun > 0 ? "#E8734A" : "#30A712"}
        />
        <Cell label="Records purged (last run)" value={lastRunAffected} color="#7A7A7A" />
      </div>
    </CardWrapper>
  );
};

const Cell = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center justify-between rounded-[8px] border border-[#F0F0F0] px-3 py-2">
    <span className="text-[12px] text-[#7A7A7A]">{label}</span>
    <span className="text-[18px] font-extrabold leading-none" style={{ color }}>
      {value}
    </span>
  </div>
);

export default RetentionLegalHold;
