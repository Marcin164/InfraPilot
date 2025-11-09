import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  icon?: any;
  text?: string;
  onClick?: any;
  type?: "button" | "submit";
  className?: string;
};

const ButtonPrimary = ({
  icon,
  text,
  onClick,
  type = "button",
  className = "",
}: Props) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={twMerge(
        "w-fit bg-[#2B9AE9] box-shadow text-[#FFFFFF] px-4 py-1 rounded-[10px] text-[20px] cursor-pointer hover:bg-[#3CABFA]",
        className
      )}
    >
      {icon && <FontAwesomeIcon icon={icon} className="pr-2 " />}
      <span>{text}</span>
    </button>
  );
};

export default ButtonPrimary;
