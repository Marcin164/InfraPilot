import React from "react";

type Props = { interfaces: any };

const Interfaces = ({ interfaces }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">Interfaces</div>
    </div>
  );
};

export default Interfaces;
