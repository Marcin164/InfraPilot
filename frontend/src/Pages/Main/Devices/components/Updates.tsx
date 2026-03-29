import React from "react";
import UpdatesTable from "../../../../Components/Tables/UpdatesTable";

type Props = { updates: any };

const Updates = ({ updates }: Props) => {
  return (
    <div className="w-full h-full max-h-[400px] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">Updates</div>
      <div className="overflow-hidden">
        <UpdatesTable data={updates} />
      </div>
    </div>
  );
};

export default Updates;
