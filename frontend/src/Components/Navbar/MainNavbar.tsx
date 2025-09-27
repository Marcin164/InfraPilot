import React from "react";
import NavbarLink from "./NavbarLink";
import { navbarItems } from "../../Constants/navigation";

type Props = {};

const MainNavbar = (props: Props) => {
  return (
    <div className="w-[300px] bg-[#FFFFFF] px-2">
      {navbarItems.map((navbarItem) => (
        <NavbarLink
          to={navbarItem.to}
          label={navbarItem.label}
          icon={navbarItem.icon}
        />
      ))}
    </div>
  );
};

export default MainNavbar;
