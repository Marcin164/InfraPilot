import React from "react";
import { useTranslation } from "react-i18next";
import NavbarLink from "./NavbarLink";
import { settingsNavbarItems } from "../../Constants/navigation";

const SettingsNavbar = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-hide">
      {settingsNavbarItems.map((navbarItem) => (
        <NavbarLink
          key={navbarItem.to}
          to={navbarItem.to}
          label={t(navbarItem.label)}
          icon={navbarItem.icon}
          alignment="vertical"
        />
      ))}
    </div>
  );
};

export default SettingsNavbar;
