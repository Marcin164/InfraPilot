import React from "react";
import StartupAppsTable from "../Tables/StartupAppsTable";

type Props = { startupApps: any };

const StartupApps = ({ startupApps }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">
        Startup apps
      </div>
      <StartupAppsTable data={startupApps} />
    </div>
  );
};

export default StartupApps;
