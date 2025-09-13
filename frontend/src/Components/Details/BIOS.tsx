import React from "react";

type Props = { bios: any };

const BIOS = ({ bios }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">BIOS</div>
      {Object.entries(bios).map(([key, value]: any) => (
        <div>
          <span className="capitalize text-[#3C3C3C] font-light">
            {key.replace(/_/g, " ")}:{" "}
          </span>
          <span className="text-[#3C3C3C] font-semibold">
            {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BIOS;
