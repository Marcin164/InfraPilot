import React, { useState } from "react";
import ButtonSecondary from "../../Buttons/ButtonSecondary";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import DropdownModal from "./DropdownModal";

type Props = {
  children: any;
};

const Dropdown = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <ButtonSecondary
        className="border border-[#3C3C3C] h-[34px]"
        onClick={() => setIsOpen((v: any) => !v)}
        icon={faEllipsis}
      />
      <DropdownModal isOpen={isOpen}>{children}</DropdownModal>
    </div>
  );
};

export default Dropdown;
