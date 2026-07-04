import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { formatNumber } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const StaleAgents = () => {
  const data = useDashboardData("fleet-stale-agents");

  const stale = data.find((d) => d.label === "staleAgents")?.value ?? 0;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#FBE0D4]">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-[24px] text-[#E8734A]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(stale)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Stale Agents</div>
        <div className="text-[11px] text-[#B0B0B0]">silent 7+ days</div>
      </div>
    </div>
  );
};

export default StaleAgents;
