import React from "react";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faUser } from "@fortawesome/free-solid-svg-icons";

type Props = { uac: any };

const UAC = ({ uac }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.uac")} icon={faUser} />
      {Object.entries(uac).map(([key, value]: any) => (
        <Parameter name={key} value={value} />
      ))}
    </div>
  );
};

export default UAC;
