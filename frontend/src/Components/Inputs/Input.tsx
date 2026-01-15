import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  label?: string;
  type?: "text" | "number" | "date";
  inputClassName?: string;
  className?: string;
  onChange?: any;
  handleChange?: any;
  defaultValue?: any;
  value?: any;
  name?: any;
  disabled?: boolean;
  errors?: any;
};

const Input = ({
  type = "text",
  label,
  inputClassName = "",
  className = "",
  onChange,
  handleChange,
  defaultValue,
  value,
  name,
  disabled = false,
  errors,
}: Props) => {
  return (
    <div className={twMerge("pt-2", className)}>
      <label htmlFor={name} className="font-bold text-[#3C3C3C]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue || null}
        value={value || null}
        type={type}
        className={twMerge(
          "w-full border border-[#535353] bg-[#FFFFFF] text-[16px] font-bold block rounded-[10px] px-3 py-2 mt-[6px]",
          inputClassName
        )}
        onChange={handleChange ? (e) => handleChange(e.target.value) : onChange}
        disabled={disabled}
      />
      {errors && (
        <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
          {errors}
        </em>
      )}
    </div>
  );
};

export default Input;
