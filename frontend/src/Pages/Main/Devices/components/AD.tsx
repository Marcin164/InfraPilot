import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faWindows } from "@fortawesome/free-brands-svg-icons";

type Props = {};

const AD = (props: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.ad")} icon={faWindows} />
      <div className="mt-3 text-[13px] text-[#9a9a9a]">Brak danych Active Directory.</div>
    </div>
  );
};

export default AD;
