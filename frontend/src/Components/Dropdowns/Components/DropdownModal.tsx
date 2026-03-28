import React from "react";

type Props = { children: any; isOpen: boolean };

const DropdownModal = ({ children, isOpen }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="absolute z-40 w-[200px] h-fit bg-[#FFFFFF] left-[-160px] top-[40px] p-2 rounded-xl shadow-xl">
      {children}
    </div>
  );
};

export default DropdownModal;
