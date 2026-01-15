import React from "react";

type Props = {};

const ApprovalStatus = (props: Props) => {
  return (
    <div className="w-[50%] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 ml-[25%] my-4 border-2 border-[#30A712]">
      <div className="text-[14px] font-light">Marcin Nowakowski</div>
      <div className="font-black text-[#30A712] uppercase">Approved</div>
    </div>
  );
};

export default ApprovalStatus;
