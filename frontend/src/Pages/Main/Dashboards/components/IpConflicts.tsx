import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { formatNumber } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const IpConflicts = () => {
  const data = useDashboardData("ipam-conflicts");

  const conflicts = data.find((d) => d.label === "conflicts")?.value ?? 0;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#FADBD8]">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-[24px] text-[#E74C3C]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(conflicts)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">IP Conflicts</div>
        <div className={`text-[11px] ${conflicts > 0 ? "font-bold text-[#E74C3C]" : "text-[#B0B0B0]"}`}>
          detected in IPAM
        </div>
      </div>
    </div>
  );
};

export default IpConflicts;
