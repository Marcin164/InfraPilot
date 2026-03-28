import React from "react";

type Props = {
  IPv4Address: string;
  NetMask: string;
  IPv4Gateway: string;
};

const IPv4 = ({ IPv4Address, NetMask, IPv4Gateway }: Props) => {
  return (
    <div>
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        IPv4 Config
      </div>
      <div>
        <span className="text-[#3C3C3C] font-light">Address: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv4Address} | ${NetMask}`}</span>
      </div>
      {IPv4Gateway && (
        <div>
          <span className="text-[#3C3C3C] font-light">Gateway: </span>
          <span className="text-[#3C3C3C] font-semibold">{IPv4Gateway}</span>
        </div>
      )}
    </div>
  );
};

export default IPv4;
