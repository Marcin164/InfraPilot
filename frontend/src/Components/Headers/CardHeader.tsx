import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = { text: string; icon?: any };

const CardHeader = ({ text, icon }: Props) => {
  return (
    <div className="text-[20px] font-semibold text-[#3C3C3C]">
      {icon && <FontAwesomeIcon className="mr-2" icon={icon} />}
      <span>{text}</span>
    </div>
  );
};

export default CardHeader;
