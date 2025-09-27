import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { cpus: any };

const CPU = ({ cpus }: Props) => {
  return (
    <div className="w-full h-full h-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">CPU</div>
      {cpus.map((cpu: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {`Processor ${index + 1}`}
          </div>
          {Object.entries(cpu).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CPU;
