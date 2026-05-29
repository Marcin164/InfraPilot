import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import HistoryFeedItem from "../../History/components/HistoryFeedItem";
import { getUsersDevices } from "../../../../Services/histories";
import type { HistoryEntry } from "../../../../Types";

const EquipmentHistory = () => {
  const { t } = useTranslation();
  const params = useParams();

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => getUsersDevices(params.id!),
  });

  const items: HistoryEntry[] = (historyQuery.data ?? []).filter(
    (h: HistoryEntry) => h.type === 0,
  );

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.equipment.history")} icon={faClockRotateLeft} />
      {historyQuery.isLoading ? (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">{t("common.loading")}</div>
      ) : items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3 max-h-[480px] overflow-y-auto">
          {items.map((entry) => (
            <HistoryFeedItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">{t("users.equipment.noHistory")}</div>
      )}
    </div>
  );
};

export default EquipmentHistory;
