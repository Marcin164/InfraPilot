import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = { rdp: any };

const RDP = ({ rdp }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">RDP</div>
      <Parameter
        name="Status"
        value={rdp.RDP_Enabled ? "Enabled" : "Disabled"}
      />
    </div>
  );
};

export default RDP;
