import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Parameter from "../../../../Components/Lists/Parameter";
import { faBorderAll } from "@fortawesome/free-solid-svg-icons";

type Props = { baseboard: any };

const MOBO = ({ baseboard = {} }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.mobo")} icon={faBorderAll} />
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        {`${baseboard.manufacturer} ${baseboard.product}`}
      </div>
      <div className="text-[13px] font-light text-[#9a9a9a] mb-2">
        {baseboard.serial_number}
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        <Parameter
          name="Hosting Board"
          value={baseboard.hosting_board ? "Yes" : "No"}
        />
        <Parameter name="Version" value={baseboard.version} />
      </div>
    </div>
  );
};

export default MOBO;
