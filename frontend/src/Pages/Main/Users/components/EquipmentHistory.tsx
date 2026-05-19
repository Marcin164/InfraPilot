import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";
import { getUsersDevices } from "../../../../Services/histories";
import { useParams } from "react-router";

const EquipmentHistory = () => {
  const { t } = useTranslation();
  const params = useParams();
  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => getUsersDevices(params.id!),
  });

  if (!historyQuery.data) return null;

  const convertToTimeline = () => {
    if (!historyQuery?.data) return null;
    return historyQuery.data
      .filter((history) => history.type === 0)
      .map((history) => ({
        ...history,
        device:
          `${history?.device?.manufacturer} ${history?.device?.model} (${history?.device?.serialNumber})` ||
          "",
      }));
  };

  const items = convertToTimeline();

  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <div className="text-[24px] sm:text-[28px] font-semibold text-[#3C3C3C] mb-2">
        {t("users.equipment.history")}
      </div>
      <div className="overflow-y-auto max-h-[480px]">
        {(items?.length ?? 0) > 0 ? (
          <TimelineLine items={items} />
        ) : (
          <div className="text-[#8A8A8A] text-[13px] py-1">
            {t("users.equipment.noHistory")}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentHistory;
