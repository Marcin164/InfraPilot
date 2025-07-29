import React from "react";
import HeadlessTable from "../Tables/HeadlessTable";

type Props = {};

const TableCard = (props: Props) => {
  return (
    <div className="bg-white w-full h-full shadow-xl rounded-[10px] px-4 ">
      <div className="text-[32px] font-semibold text-[#3C3C3C] py-2">
        Last scans
      </div>
      <div className="h-[calc(100%-70px)] overflow-x-hidden">
        <HeadlessTable />
      </div>
    </div>
  );
};

export default TableCard;
