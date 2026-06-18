import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  faArrowsRotate,
  faArrowUpRightFromSquare,
  faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";
import { getDeviceHistory } from "../../../../Services/histories";
import { getUser } from "../../../../Services/users";
import HistoryFeedItem from "../../History/components/HistoryFeedItem";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import type { HistoryEntry } from "../../../../Types";

const History = () => {
  const { id: deviceId } = useParams<{ id: string }>();
  const device: any = useOutletContext();
  const { t } = useTranslation();

  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);

  const assignedUserId = device?.data?.userId;
  const assignedUserQuery = useQuery({
    queryKey: ["device-assigned-user", assignedUserId],
    queryFn: () => getUser(assignedUserId),
    enabled: Boolean(assignedUserId),
  });

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

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <CardHeader text={t("device.tab.history")} icon={faUserTag} />
          <ButtonPrimary
            icon={faArrowsRotate}
            text={t("device.history.assign")}
            onClick={() => setIsAssignUserModalOpen(true)}
          />
        </div>
        <div className="mt-3">
          {assignedUserId ? (
            assignedUserQuery.data ? (
              <Link
                to={`/admin/users/${assignedUserId}`}
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#F0F6FC] px-3 py-1.5 text-[#2B9AE9] hover:underline text-[14px] font-semibold"
              >
                <FontAwesomeIcon icon={faUserTag} />
                {assignedUserQuery.data.distinguishedName ?? assignedUserQuery.data.email}
              </Link>
            ) : (
              <div className="text-[13px] text-[#9a9a9a]">Wczytywanie przypisanego użytkownika...</div>
            )
          ) : (
            <div className="text-[13px] text-[#9a9a9a]">
              Urządzenie nie jest przypisane do żadnego użytkownika.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[14px] font-semibold text-[#3C3C3C]">
            Historia przypisań i zmian
          </span>
          <Link
            to={`/admin/history?deviceId=${deviceId}`}
            className="flex items-center gap-1 text-[13px] font-semibold text-[#2B9AE9] hover:underline"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px]" />
            {t("device.history.viewGlobal")}
          </Link>
        </div>

        {historyQuery.isLoading ? (
          <div className="text-[14px] text-[#9a9a9a]">{t("common.loading")}</div>
        ) : historyQuery.isError ? (
          <div className="text-[14px] text-[#BC0E0E]">{t("history.loadFailed")}</div>
        ) : entries.length === 0 ? (
          <div className="text-[14px] text-[#9a9a9a]">{t("device.history.noEntries")}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <HistoryFeedItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <AssignDeviceModal
        isModalOpen={isAssignUserModalOpen}
        handleOnClose={() => setIsAssignUserModalOpen(false)}
      />
    </div>
  );
};

export default History;
