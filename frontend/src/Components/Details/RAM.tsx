import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { rams: any };

const RAM = ({ rams }: Props) => {
  return (
    <div className="w-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">RAM</div>
      {rams.map((ram: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="underline">Module {index + 1}</div>
          {Object.entries(ram).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default RAM;
