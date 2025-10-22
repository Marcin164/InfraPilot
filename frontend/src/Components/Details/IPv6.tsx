import React from "react";

type Props = {
  IPv6Address: string;
  IPv6Gateway: string;
  IPv6LinkLocal: string;
};

const IPv6 = ({ IPv6Address, IPv6Gateway, IPv6LinkLocal }: Props) => {
  if (!IPv6Address) return null;
  return (
    <div>
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        IPv6 Config
      </div>
      <div>
        <span className="text-[#3C3C3C] font-light">Address: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv6Address}`}</span>
      </div>
      {IPv6Gateway && (
        <div>
          <span className="text-[#3C3C3C] font-light">Gateway: </span>
          <span className="text-[#3C3C3C] font-semibold">{IPv6Gateway}</span>
        </div>
      )}
      <div>
        <span className="text-[#3C3C3C] font-light">Link-Local: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv6LinkLocal}`}</span>
      </div>
    </div>
  );
};

export default IPv6;
