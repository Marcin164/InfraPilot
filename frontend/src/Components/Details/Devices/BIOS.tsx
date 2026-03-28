import React from "react";
import CardHeader from "../../Headers/CardHeader";
import Parameter from "../../Lists/Parameter";

type Props = { bios: any };

const BIOS = ({ bios }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="BIOS" />
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        {bios.manufacturer}
      </div>
      <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
        {bios.serial_number}
      </div>
      <Parameter
        name="SMBIOS"
        value={`${bios.smbios_major}.${bios.smbios_minor}`}
      />
      <Parameter name="Version" value={bios.version} />
    </div>
  );
};

export default BIOS;
