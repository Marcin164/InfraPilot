import React from "react";
import NavbarLink from "./NavbarLink";
import { reportsNavbarItems } from "../../Constants/navigation";

type Props = {};

const ReportsNavbar = (props: Props) => {
  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      {reportsNavbarItems.map((navbarItem) => (
        <NavbarLink
          to={navbarItem.to}
          label={navbarItem.label}
          icon={navbarItem.icon}
          alignment="vertical"
        />
      ))}
    </div>
  );
};

export default ReportsNavbar;
