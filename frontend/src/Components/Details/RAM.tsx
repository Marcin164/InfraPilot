import React from "react";
import Parameter from "../Lists/Parameter";
import CardHeader from "../Headers/CardHeader";
import Badge from "../Badges/Badge";

type Props = { rams: any };

const RAM = ({ rams }: Props) => {
  const bytesToGB = (bytes: number) => {
    const GB_DECIMAL = bytes / 1000 ** 3; // 1 GB = 1000^3 B

    return GB_DECIMAL.toFixed(2) + " GB";
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="RAM" />
      {rams.map((ram: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {`${ram.manufacturer} ${ram.part_number}`}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {ram.serial_number}
          </div>
          <div className="flex mb-2">
            <Badge text={`${ram.speed} MHz`} className="bg-[#2B9AE9]" />
            <Badge
              text={bytesToGB(Number.parseInt(ram.capacity))}
              className="bg-[#2B9AE9]"
            />
          </div>
          <Parameter name="Bank Label" value={ram.bank_label} />
          <Parameter name="Device Locator" value={ram.device_locator} />
        </div>
      ))}
    </div>
  );
};

export default RAM;
