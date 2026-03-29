import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = { uac: any };

const UAC = ({ uac }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">UAC</div>
      {Object.entries(uac).map(([key, value]: any) => (
        <Parameter name={key} value={value} />
      ))}
    </div>
  );
};

export default UAC;
