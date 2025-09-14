import React from "react";

type Props = { bitlocker: any };

const Bitlocker = ({ bitlocker }: Props) => {
  const getBitlockerStatusColor = () => {
    switch (bitlocker.status) {
      case "Unknown":
        return "#3C3C3C";
    }
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">BitLocker</div>
      <div
        className="px-2 py-1 w-fit text-[#FFFFFF] rounded"
        style={{ background: getBitlockerStatusColor() }}
      >
        {bitlocker.status}
      </div>
    </div>
  );
};

export default Bitlocker;
