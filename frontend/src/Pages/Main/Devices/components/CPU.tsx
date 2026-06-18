import React from "react";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import StatusPill from "../../../../Components/Badges/StatusPill";
import { faMicrochip } from "@fortawesome/free-solid-svg-icons";

type Props = { cpus: any };

const CPU = ({ cpus }: Props) => {
  const { t } = useTranslation();
  const architectures = [
    { number: 0, name: "x86", description: "32-bit Intel/AMD" },
    { number: 1, name: "MIPS", description: "MIPS" },
    { number: 2, name: "Alpha", description: "DEC Alpha" },
    { number: 3, name: "PowerPC", description: "IBM PowerPC" },
    { number: 5, name: "ARM", description: "32-bit ARM" },
    {
      number: 6,
      name: "Itanium",
      description: "Intel Itanium (IA-64)",
    },
    {
      number: 9,
      name: "x64",
      description: "64-bit Intel/AMD (AMD64)",
    },
    { number: 12, name: "ARM64", description: "64-bit ARM" },
  ];

  return (
    <div className="w-full h-full h-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("device.section.cpu")} icon={faMicrochip} />
      {(cpus ?? []).map((cpu: any, index: number) => {
        const architecture = architectures.find(
          (a: any) => a.number === cpu.architecture,
        );
        return (
          <div key={index} className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0">
            <div className="text-[16px] font-semibold text-[#2B9AE9]">
              {cpu.name}
            </div>
            <div className="text-[13px] font-light text-[#9a9a9a] mb-2 truncate">
              {cpu.processor_id}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <StatusPill tone="green" text={`${cpu.cores} Cores`} />
              <StatusPill tone="green" text={`${cpu.threads} Threads`} />
              {architecture && <StatusPill tone="blue" text={architecture.name} />}
            </div>
            <div className="divide-y divide-[#F0F0F0]">
              {architecture && (
                <Parameter name="Architecture" value={architecture.description} />
              )}
              <Parameter name="L2 Cache" value={cpu.l2_cache} />
              <Parameter name="L3 Cache" value={cpu.l3_cache} />
              <Parameter name="Socket" value={cpu.socket} />
              <Parameter
                name="Clock Speed"
                value={`${cpu.current_clock_speed} / ${cpu.max_clock_speed} MHz`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CPU;
