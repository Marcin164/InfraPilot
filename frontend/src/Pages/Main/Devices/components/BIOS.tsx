import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Parameter from "../../../../Components/Lists/Parameter";
import { faMicrochip } from "@fortawesome/free-solid-svg-icons";

type Props = { bios: any };

const BIOS = ({ bios = {} }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.bios")} icon={faMicrochip} />
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        {bios.manufacturer}
      </div>
      <div className="text-[13px] font-light text-[#9a9a9a] mb-2">
        {bios.serial_number}
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        <Parameter
          name={t("device.parameter.smbios")}
          value={`${bios.smbios_major}.${bios.smbios_minor}`}
        />
        <Parameter name={t("device.parameter.version")} value={bios.version} />
      </div>
    </div>
  );
};

export default BIOS;
