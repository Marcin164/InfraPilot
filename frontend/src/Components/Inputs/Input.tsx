import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  label: string;
  type?: "text" | "number" | "date";
  className?: string;
  onChange?: any;
  handleChange?: any;
  value?: any;
  name?: any;
  disabled?: boolean;
};

const Input = ({
  type = "text",
  label,
  className = "",
  onChange,
  handleChange,
  value,
  name,
  disabled = false,
}: Props) => {
  return (
    <div className={twMerge("pt-2", className)}>
      <label htmlFor={name} className="font-bold text-[#3C3C3C]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value || null}
        type={type}
        className="w-full border border-[#535353] text-[16px] font-bold block rounded-[10px] px-3 py-2 mt-1"
        onChange={handleChange ? (e) => handleChange(e.target.value) : onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default Input;
