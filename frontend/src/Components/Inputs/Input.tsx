import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  label: string;
  type?: "text" | "number";
  className?: string;
  onChange?: any;
};

const Input = ({ type = "text", label, className = "", onChange }: Props) => {
  return (
    <div className={twMerge("py-4", className)}>
      <label className="font-bold text-[#3C3C3C]">{label}</label>
      <input
        type={type}
        className="w-full border border-[#535353] text-[16px] font-bold block rounded-[10px] px-3 py-2 mt-2"
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
