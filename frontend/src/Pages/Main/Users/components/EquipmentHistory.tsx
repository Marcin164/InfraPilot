import { useQuery } from "@tanstack/react-query";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";
import { getUsersDevices } from "../../../../Services/histories";
import { useParams } from "react-router";

type Props = {};

const EquipmentHistory = (props: Props) => {
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
      .map((history) => {
        return {
          ...history,
          device:
            `${history?.device?.manufacturer} ${history?.device?.model} (${history?.device?.serialNumber})` ||
            "",
        };
      });
  };

  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">
        Equipment History
      </div>
      <div>
        {(convertToTimeline()?.length ?? 0) > 0 ? (
          <TimelineLine items={convertToTimeline()} />
        ) : (
          <div>No history entries</div>
        )}
      </div>
    </div>
  );
};

export default EquipmentHistory;
