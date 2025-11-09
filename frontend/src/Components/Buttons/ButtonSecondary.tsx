import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = { icon?: any; text: string; onClick?: any };

const ButtonSecondary = ({ icon, text, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="px-3 h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]"
    >
      {icon && <FontAwesomeIcon icon={icon} className="pr-2 " />}
      <span>{text}</span>
    </button>
  );
};

export default ButtonSecondary;
