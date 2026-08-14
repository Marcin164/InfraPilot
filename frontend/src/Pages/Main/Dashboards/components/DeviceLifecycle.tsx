import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { fleetOverview } from "../../../../Services/fleet";

const LIFECYCLE_COLOR: Record<string, string> = {
  procurement: "#8A8A8A",
  active: "#30A712",
  in_repair: "#F1C40F",
  in_storage: "#2B9AE9",
  retired: "#8E44AD",
  disposed: "#7F8C8D",
  lost: "#F3606E",
};

const DeviceLifecycle = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["fleet-overview"],
    queryFn: fleetOverview,
    refetchInterval: 60000,
  });

  const lifecycle = data?.lifecycle ?? {};

  const lifecycleLabel = (state: string): string => {
    switch (state) {
      case "procurement":
        return t("device.lifecycle.procurement");
      case "active":
        return t("device.lifecycle.active");
      case "in_repair":
        return t("device.lifecycle.repair");
      case "in_storage":
        return t("device.lifecycle.storage");
      case "retired":
        return t("device.lifecycle.retired");
      case "disposed":
        return t("device.lifecycle.disposed");
      case "lost":
        return t("device.lifecycle.lost");
      default:
        return state.replace("_", " ");
    }
  };

  const entries = Object.entries(lifecycle);

  return (
    <CardWrapper
      title={t("dashboard.widget.deviceLifecycle")}
      subtitle={t("dashboard.widget.deviceLifecycle.subtitle")}
    >
      {entries.length === 0 ? (
        <div className="text-[13px] text-[#8A8A8A]">{t("common.noResults")}</div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center w-full">
          {entries.map(([state, count]) => (
            <div
              key={state}
              className="flex items-center gap-2 rounded-full border border-[#E0E0E0] px-3 py-1 text-[13px]"
            >
              <span
                className="w-[10px] h-[10px] rounded-full"
                style={{ backgroundColor: LIFECYCLE_COLOR[state] ?? "#8A8A8A" }}
              />
              <span className="text-[#3C3C3C]">{lifecycleLabel(state)}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      )}
    </CardWrapper>
  );
};

export default DeviceLifecycle;
