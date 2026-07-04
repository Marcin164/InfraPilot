import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const STAGE_ORDER = ["draft", "submitted", "approved", "ordered", "received"];

const ProcurementPipeline = () => {
  const { t } = useTranslation();
  const data = useDashboardData("procurement-pipeline");

  const max = Math.max(1, ...data.map((d) => d.value));

  const stages = STAGE_ORDER.map((status) => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: data.find((d) => d.label === status)?.value ?? 0,
  }));

  return (
    <CardWrapper
      title={t("dashboard.widget.procurementPipeline")}
      subtitle={t("dashboard.widget.procurementPipeline.subtitle")}
      accent="#3FAE6B"
    >
      <div className="flex h-full w-full items-stretch gap-3 pt-1">
        {stages.map((stage) => (
          <div key={stage.status} className="flex flex-1 flex-col gap-2">
            <div className="text-[22px] font-extrabold leading-none text-[#3C3C3C]">
              {stage.value}
            </div>
            <div className="text-[11px] font-semibold text-[#8A8A8A] truncate">
              {stage.label}
            </div>
            <div className="h-[8px] w-full rounded-[5px] bg-[#EAF7EF] overflow-hidden">
              <div
                className="h-full rounded-[5px] bg-[#3FAE6B]"
                style={{ width: `${(stage.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
};

export default ProcurementPipeline;
