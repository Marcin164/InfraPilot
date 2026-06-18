import React from "react";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import StatusPill from "../../../../Components/Badges/StatusPill";
import { faMemory } from "@fortawesome/free-solid-svg-icons";

type Props = { rams: any };

const RAM = ({ rams }: Props) => {
  const { t } = useTranslation();
  const bytesToGB = (bytes: number) => {
    const GB_DECIMAL = bytes / 1000 ** 3; // 1 GB = 1000^3 B

    return GB_DECIMAL.toFixed(2) + " GB";
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.ram")} icon={faMemory} />
      {(rams ?? []).map((ram: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {`${ram.manufacturer} ${ram.part_number}`}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-2">
            {ram.serial_number}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <StatusPill tone="blue" text={`${ram.speed} MHz`} />
            <StatusPill tone="blue" text={bytesToGB(Number.parseInt(ram.capacity))} />
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter name="Bank Label" value={ram.bank_label} />
            <Parameter name="Device Locator" value={ram.device_locator} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RAM;
