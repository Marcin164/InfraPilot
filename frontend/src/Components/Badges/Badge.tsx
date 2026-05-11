import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  icon?: any;
  text: string;
  style?: any;
};

const Badge = ({ icon, className = "", text, style }: Props) => {
  return (
    <div
      className={twMerge(
        "w-fit mr-2 px-2 py-1 rounded-[5px] text-[16px] text-center text-[#FFFFFF]",
        className,
      )}
      style={style}
    >
      {icon && <FontAwesomeIcon className="mr-1" icon={icon} />}
      <span className="font-bold">{text}</span>
    </div>
  );
};

export default Badge;
