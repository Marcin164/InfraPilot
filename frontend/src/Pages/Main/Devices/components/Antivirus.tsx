import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faVirusSlash } from "@fortawesome/free-solid-svg-icons";

type Props = { avs: any };

const Antivirus = ({ avs }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.av")} icon={faVirusSlash} />
      {avs.map((av: any) => (
        <div className="pt-2">
          <div className="text-[#3C3C3C] text-[16px] font-bold">{`${av.displayName} (${av.productState})`}</div>
          <div className="text-[#3C3C3C] font-light">
            {av.pathToSignedProductExe}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Antivirus;
