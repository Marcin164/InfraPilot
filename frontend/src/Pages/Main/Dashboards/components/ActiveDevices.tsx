import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop } from "@fortawesome/free-solid-svg-icons";
import { formatNumber } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const ActiveDevices = () => {
  const data = useDashboardData("devices-online-offline");

  const online = data.find((d) => d.label.toLowerCase() === "online")?.value ?? 0;
  const offline = data.find((d) => d.label.toLowerCase() === "offline")?.value ?? 0;
  const total = online + offline;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#D7EEFF]">
        <FontAwesomeIcon icon={faDesktop} className="text-[24px] text-[#2B9AE9]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(total)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Active Devices</div>
        <div className="text-[11px] text-[#B0B0B0]">{online} online</div>
      </div>
    </div>
  );
};

export default ActiveDevices;
