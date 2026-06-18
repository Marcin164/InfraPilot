import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";

type Props = { stats: any };

const NetworkStats = ({ stats }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.networkStats")} icon={faChartBar} />
      <div className="mt-2 space-y-3">
        {Object.entries(stats).map(([connectionName, values]: any) => (
          <div
            key={connectionName}
            className="pt-2 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
          >
            <div className="text-[14px] font-semibold text-[#2B9AE9] mb-1">
              {connectionName}
            </div>
            <div className="divide-y divide-[#F0F0F0]">
              {Object.entries(values).map(([key, value]: any) => (
                <Parameter key={key} name={key} value={value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkStats;
