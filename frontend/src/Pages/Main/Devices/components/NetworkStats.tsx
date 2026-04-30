import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";

type Props = { stats: any };

const NetworkStats = ({ stats }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Stats" icon={faChartBar} />
      <div className="py-2">
        {Object.entries(stats).map(([connectionName, values]: any) => (
          <div>
            <div className="underline">{connectionName}</div>
            {Object.entries(values).map(([key, value]: any) => (
              <Parameter name={key} value={value} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkStats;
