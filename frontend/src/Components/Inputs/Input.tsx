import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  label?: string;
  type?: "text" | "number" | "date" | "password" | "time" | "file";
  inputClassName?: string;
  className?: string;
  onChange?: any;
  handleChange?: any;
  defaultValue?: any;
  value?: any;
  name?: any;
  disabled?: boolean;
  placeholder?: string;
  suffix?: string;
  errors?: any;
  accept?: string;
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
  placeholder,
  suffix,
  errors,
  accept,
}: Props) => {
  return (
    <div className={twMerge("pt-2", className)}>
      {label && (
        <label htmlFor={name} className="font-bold text-[#3C3C3C]">
          {label}
        </label>
      )}
      <div className="flex">
        <input
          id={name}
          name={name}
          defaultValue={defaultValue ?? undefined}
          value={type === "file" ? undefined : value ?? ""}
          placeholder={placeholder}
          type={type}
          accept={type === "file" ? accept : undefined}
          className={twMerge(
            "w-full border border-[#535353] bg-[#FFFFFF] text-[16px] font-bold block rounded-[10px] px-3 py-2",
            suffix && "rounded-r-[0px] border-r-[0px]",
            label && "mt-[6px]",
            inputClassName,
          )}
          onChange={
            handleChange
              ? type === "file"
                ? (e) => handleChange(e.target.files?.[0] ?? null)
                : (e) => handleChange(e.target.value)
              : onChange
          }
          disabled={disabled}
        />
        {suffix && (
          <div className="flex justify-center items-center bg-[#2B9AE9] text-[#FFFFFF] font-bold text-[16px] mt-[6px] px-4 rounded-r-[10px] border-y border-r border-[#535353]">
            {suffix}
          </div>
        )}
      </div>
      {errors && (
        <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
          {errors}
        </em>
      )}
    </div>
  );
};

export default Input;
