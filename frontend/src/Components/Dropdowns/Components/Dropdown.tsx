import React, { useState } from "react";
import ButtonPrimary from "../../Buttons/ButtonPrimary";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import DropdownModal from "./DropdownModal";

type Props = {
  children: any;
};

const Dropdown = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <ButtonPrimary
        className="border border-[#3C3C3C] h-[34px]"
        color="white"
        onClick={() => setIsOpen((v: any) => !v)}
        icon={faEllipsis}
      />
      <DropdownModal isOpen={isOpen}>{children}</DropdownModal>
    </div>
  );
};

export default Dropdown;
