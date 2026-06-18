import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import moment from "moment";
import StatusPill from "../../../../Components/Badges/StatusPill";
import { faDesktop, faUser } from "@fortawesome/free-solid-svg-icons";

type Props = { systemInfo: any };

const OS = ({ systemInfo }: Props) => {
  const { t } = useTranslation();
  if (!systemInfo) return null;
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.os")} icon={faDesktop} />
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        {systemInfo?.hostname}
      </div>
      <div className="text-[#3C3C3C] font-semibold">
        {systemInfo?.Cim?.Caption}
      </div>
      <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
        {systemInfo?.Cim?.Version}
      </div>
      <StatusPill icon={faUser} tone="blue" text={`Zalogowany: ${systemInfo?.username}`} />
      <div className="mt-2 divide-y divide-[#F0F0F0]">
        <Parameter name="Serial Number" value={systemInfo?.Cim?.SerialNumber} />
        <Parameter name="Architecture" value={systemInfo?.Cim?.OSArchitecture} />
        <Parameter name="Machine" value={systemInfo?.machine} />
        <Parameter
          name="Boot time"
          value={moment(systemInfo?.boot_time).format("DD MMMM YYYY, hh:mm:ss")}
        />
        <Parameter
          name="Install date"
          value={moment(systemInfo?.Cim?.InstallDate).format(
            "DD MMMM YYYY, hh:mm:ss",
          )}
        />
      </div>
    </div>
  );
};

export default OS;
