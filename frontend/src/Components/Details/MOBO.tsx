import React from "react";

type Props = { baseboard: any };

const MOBO = ({ baseboard }: Props) => {
  return (
    <div className="w-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">
        Motherboard
      </div>
      {Object.entries(baseboard).map(([key, value]: any) => (
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

export default MOBO;
