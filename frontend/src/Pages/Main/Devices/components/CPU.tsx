import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Badge from "../../../../Components/Badges/Badge";
import { faMicrochip } from "@fortawesome/free-solid-svg-icons";

type Props = { cpus: any };

const CPU = ({ cpus }: Props) => {
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
      <CardHeader text="CPU" icon={faMicrochip} />
      {cpus.map((cpu: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {cpu.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {cpu.processor_id}
          </div>
          <div className="flex">
            <Badge text={`${cpu.cores} Cores`} className="bg-[#30A712]" />
            <Badge text={`${cpu.threads} Threads`} className="bg-[#30A712]" />
          </div>
          <Parameter
            name="Architecture"
            value={`              ${
              architectures.find(
                (architecture: any) => architecture.number === cpu.architecture,
              )?.name
            }
              (${
                architectures.find(
                  (architecture: any) =>
                    architecture.number === cpu.architecture,
                )?.description
              })
            `}
          />
          <Parameter name="L2 Cache" value={cpu.l2_cache} />
          <Parameter name="L3 Cache" value={cpu.l3_cache} />
          <Parameter name="Socket" value={cpu.socket} />
          <Parameter
            name="Clock Speed"
            value={`${cpu.current_clock_speed} / ${cpu.max_clock_speed}`}
          />
        </div>
      ))}
    </div>
  );
};

export default CPU;
