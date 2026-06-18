import React from "react";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faUser } from "@fortawesome/free-solid-svg-icons";

type Props = { uac: any };

const UAC = ({ uac }: Props) => {
  const { t } = useTranslation();
  const entries = Object.entries(uac ?? {});
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.uac")} icon={faUser} />
      {entries.length === 0 ? (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">Brak danych.</div>
      ) : (
        <div className="mt-2 divide-y divide-[#F0F0F0]">
          {entries.map(([key, value]: any) => (
            <Parameter key={key} name={key} value={value} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UAC;
