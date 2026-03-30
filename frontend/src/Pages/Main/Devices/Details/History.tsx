import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { faArrowsRotate, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";
import ApplyChangesModal from "../../../../Components/Modals/ApplyChangesModal";
import { getDeviceHistory } from "../../../../Services/histories";
import HistorySection from "../components/HistorySection";
import type { HistoryEntry } from "../../../../Types";

const History = () => {
  const { id: deviceId } = useParams<{ id: string }>();

  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [isApplyChangesModalOpen, setIsApplyChangesModalOpen] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["device-history", deviceId],
    queryFn: () => getDeviceHistory(deviceId!),
    enabled: Boolean(deviceId),
  });

  const ownersHistory = useMemo(() => {
    if (!historyQuery.data) return [];

    return historyQuery.data
      .filter((history: HistoryEntry) => history.type === 0)
      .map((history: HistoryEntry) => ({
        ...history,
        device: null,
        owner: history.user?.distinguishedName ?? "",
      }));
  }, [historyQuery.data]);

  const changesHistory = useMemo(() => {
    if (!historyQuery.data) return [];
    return historyQuery.data.filter(
      (history: HistoryEntry) => history.type !== 0
    );
  }, [historyQuery.data]);

  if (historyQuery.isLoading) {
    return <div>Loading history…</div>;
  }

  if (historyQuery.isError) {
    return <div>Failed to load history</div>;
  }

  return (
    <div className="flex justify-between gap-2">
      <HistorySection
        title="Owners"
        emptyText="This device has no owners yet"
        items={ownersHistory}
        buttonIcon={faArrowsRotate}
        buttonText="Assign device"
        onButtonClick={() => setIsAssignUserModalOpen(true)}
      >
        <AssignDeviceModal
          isModalOpen={isAssignUserModalOpen}
          handleOnClose={() => setIsAssignUserModalOpen(false)}
        />
      </HistorySection>

      <HistorySection
        title="Changes"
        emptyText="This device has no changes yet"
        items={changesHistory}
        buttonIcon={faMicrochip}
        buttonText="Apply Changes"
        onButtonClick={() => setIsApplyChangesModalOpen(true)}
      >
        <ApplyChangesModal
          isModalOpen={isApplyChangesModalOpen}
          handleOnClose={() => setIsApplyChangesModalOpen(false)}
        />
      </HistorySection>
    </div>
  );
};

export default History;
