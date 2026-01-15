import React from "react";

type Props = {};

const Worknotes = (props: Props) => {
  return (
    <div className="w-[30%] bg-[#F3F2A0] shadow-xl p-4 ml-[52%] my-4 border-2 border-[#9F9D00]">
      <div className="text-[14px] font-light">Description</div>
      <div className="font-bold">Details</div>
    </div>
  );
};

export default Worknotes;
