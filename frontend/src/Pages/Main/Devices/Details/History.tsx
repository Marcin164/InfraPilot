import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  faArrowsRotate,
  faArrowUpRightFromSquare,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";
import { getDeviceHistory } from "../../../../Services/histories";
import HistoryFeedItem from "../../History/components/HistoryFeedItem";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import type { HistoryEntry } from "../../../../Types";

const History = () => {
  const { id: deviceId } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["device-history", deviceId],
    queryFn: () => getDeviceHistory(deviceId!),
    enabled: Boolean(deviceId),
  });

  const entries: HistoryEntry[] = useMemo(() => {
    if (!historyQuery.data) return [];
    return [...historyQuery.data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [historyQuery.data]);

  if (historyQuery.isLoading) {
    return <div className="p-4 text-[#535353]">{t("common.loading")}</div>;
  }

  if (historyQuery.isError) {
    return <div className="p-4 text-[#BC0E0E]">{t("history.loadFailed")}</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <CardHeader text={t("device.tab.history")} icon={faClockRotateLeft} />
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/history?deviceId=${deviceId}`}
            className="flex items-center gap-1 text-[13px] font-semibold text-[#2B9AE9] hover:underline"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px]" />
            {t("device.history.viewGlobal")}
          </Link>
          <ButtonPrimary
            icon={faArrowsRotate}
            text={t("device.history.assign")}
            onClick={() => setIsAssignUserModalOpen(true)}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 text-[14px] text-[#9a9a9a]">
          {t("device.history.noEntries")}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {entries.map((entry) => (
            <HistoryFeedItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <AssignDeviceModal
        isModalOpen={isAssignUserModalOpen}
        handleOnClose={() => setIsAssignUserModalOpen(false)}
      />
    </div>
  );
};

export default History;
