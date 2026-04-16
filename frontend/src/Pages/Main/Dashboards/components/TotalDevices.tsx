import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputer } from "@fortawesome/free-solid-svg-icons";
import { getReports } from "../../../../Services/reports";
import { formatNumber } from "../helpers";

const TotalDevices = () => {
  const { data } = useQuery({
    queryKey: ["report", "devices-by-manufacturer"],
    queryFn: () => getReports("devices-by-manufacturer"),
  });

  const total = (data ?? []).reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#D5F5E3]">
        <FontAwesomeIcon icon={faComputer} className="text-[24px] text-[#2ECC71]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(total)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Total Devices</div>
      </div>
    </div>
  );
};

export default TotalDevices;
