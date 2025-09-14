import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { rdp: any };

const RDP = ({ rdp }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">RDP</div>
      {Object.entries(rdp).map(([key, value]: any) => (
        <Parameter name={key} value={value} />
      ))}
    </div>
  );
};

export default RDP;
