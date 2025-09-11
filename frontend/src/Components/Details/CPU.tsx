import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { cpus: any };

const CPU = ({ cpus }: Props) => {
  return (
    <div className="w-fit h-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">CPU</div>
      {cpus.map((cpu: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="underline">Processor {index + 1}</div>
          {Object.entries(cpu).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CPU;
