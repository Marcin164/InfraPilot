import React from "react";

type Props = {};

const SystemInfo = ({}: Props) => {
  return (
    <div className="w-[300px] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">
        System Info
      </div>
      <div className="text-[#3C3C3C] text-[15px] my-2">
        <span className="font-bold">Hostname: </span>
        <span>PAYROLL01</span>
      </div>
    </div>
  );
};

export default SystemInfo;
