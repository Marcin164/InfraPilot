import React from "react";
import NavbarLink from "./NavbarLink";
import { settingsNavbarItems } from "../../Constants/navigation";

type Props = {};

const SettingsNavbar = (props: Props) => {
  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      {settingsNavbarItems.map((navbarItem) => (
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

export default SettingsNavbar;
