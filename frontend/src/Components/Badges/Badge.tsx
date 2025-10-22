import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  icon?: any;
  text: string;
};

const Badge = ({ icon, className = "", text }: Props) => {
  return (
    <div
      className={twMerge(
        "w-fit mr-2 px-2 rounded-[5px] text-[16px] mt-2 text-center text-[#FFFFFF]",
        className
      )}
    >
      {icon && <FontAwesomeIcon className="mr-1" icon={icon} />}
      <span className="text-bold">{text}</span>
    </div>
  );
};

export default Badge;
