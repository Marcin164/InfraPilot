import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = { text: string; icon?: any };

const Header = ({ text, icon }: Props) => {
  return (
    <div className="text-[20px] font-semibold text-[#3C3C3C] pt-2 pb-4">
      {icon && <FontAwesomeIcon className="mr-2" icon={icon} />}
      <span>{text}</span>
    </div>
  );
};

export default Header;
