import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import moment from "moment";
import CardWrapper from "./CardWrapper";
import { staleAgents } from "../../../../Services/fleet";

const StaleAgentsList = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["fleet-stale-agents-list"],
    queryFn: () => staleAgents(),
    refetchInterval: 60000,
  });

  const items = data ?? [];

  return (
    <CardWrapper
      title={t("dashboard.widget.staleAgentsList")}
      subtitle={t("dashboard.widget.staleAgentsList.subtitle")}
      accent="#E8734A"
    >
      {isLoading ? (
        <div className="text-[13px] text-[#8A8A8A]">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="text-[13px] text-[#8A8A8A]">{t("fleet.allReporting")}</div>
      ) : (
        <div className="h-full w-full overflow-y-auto divide-y divide-[#F0F0F0]">
          {items.slice(0, 15).map((d) => (
            <Link
              key={d.id}
              to={`/admin/devices/${d.id}/system`}
              className="flex items-center justify-between gap-2 py-1.5 px-1 hover:bg-[#FAFAFA] rounded"
            >
              <span className="text-[12px] font-bold text-[#3C3C3C] truncate">
                {d.assetName || `${d.manufacturer ?? ""} ${d.model ?? ""}`.trim() || d.serialNumber || "—"}
              </span>
              <span className="text-[11px] text-[#F3606E] font-bold shrink-0">
                {d.lastScanAt ? moment(d.lastScanAt).fromNow() : t("fleet.never")}
              </span>
            </Link>
          ))}
          {items.length > 15 && (
            <div className="text-[11px] text-[#8A8A8A] pt-1.5 px-1">
              {t("fleet.andMore", { count: items.length - 15 })}
            </div>
          )}
        </div>
      )}
    </CardWrapper>
  );
};

export default StaleAgentsList;
