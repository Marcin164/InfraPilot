import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey } from "@fortawesome/free-solid-svg-icons";
import { formatNumber } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const LicensesExpiring = () => {
  const data = useDashboardData("licenses-expiring-soon");

  const expiring = data.find((d) => d.label === "expiringSoon")?.value ?? 0;
  const activeTotal = data.find((d) => d.label === "activeTotal")?.value ?? 0;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#FBEBD1]">
        <FontAwesomeIcon icon={faKey} className="text-[24px] text-[#E8A33D]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(expiring)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Licenses Expiring</div>
        <div className="text-[11px] text-[#B0B0B0]">of {activeTotal} active</div>
      </div>
    </div>
  );
};

export default LicensesExpiring;
