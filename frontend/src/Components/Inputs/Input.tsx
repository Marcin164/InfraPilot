import React from "react";

type Props = {
  label: string;
  type?: "text" | "number";
  className?: string;
};

const Input = ({ type = "text", label, className = "" }: Props) => {
  return (
    <div className={className}>
      <label className="font-bold text-[#3C3C3C]">{label}</label>
      <input
        type={type}
        className="w-full border border-[#535353] text-[16px] font-bold block rounded-[10px] px-3 py-2 mt-2"
      />
    </div>
  );
};

export default Input;
