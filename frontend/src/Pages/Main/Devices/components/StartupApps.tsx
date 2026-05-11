import React from "react";
import { useTranslation } from "react-i18next";
import StartupAppsTable from "../../../../Components/Tables/StartupAppsTable";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";

type Props = { startupApps: any };

const StartupApps = ({ startupApps }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.startupApps")} icon={faCirclePlay} />
      <StartupAppsTable data={startupApps} />
    </div>
  );
};

export default StartupApps;
