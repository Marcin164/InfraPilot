import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { twMerge } from "tailwind-merge";

type ButtonPrimaryProps = {
  icon?: IconProp;
  text: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
};

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  icon,
  text,
  onClick,
  type = "button",
  className,
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={twMerge(
        "inline-flex items-center gap-2 rounded-[10px] px-4 py-1 text-[20px] font-medium transition-colors",
        "bg-[#2B9AE9] text-white hover:bg-[#3CABFA]",
        "disabled:bg-[#A7CDEE] disabled:text-white/70 disabled:cursor-not-allowed disabled:hover:bg-[#A7CDEE]",
        className
      )}
    >
      {icon && <FontAwesomeIcon icon={icon} />}
      <span>{text}</span>
    </button>
  );
};

export default ButtonPrimary;
