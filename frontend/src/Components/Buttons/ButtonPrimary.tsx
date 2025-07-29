import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  icon?: any;
  text?: string;
  onClick: any;
};

const ButtonPrimary = ({ icon, text, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="w-fit bg-[#2B9AE9] box-shadow text-[#FFFFFF] px-4 py-1 rounded-[10px] mx-1 text-[20px] cursor-pointer hover:bg-[#3CABFA]"
    >
      <FontAwesomeIcon icon={icon} className="pr-2 " />
      <span>{text}</span>
    </button>
  );
};

export default ButtonPrimary;
