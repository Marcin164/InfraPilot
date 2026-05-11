import React from "react";
import { useTranslation } from "react-i18next";
import NavbarLink from "./NavbarLink";
import { settingsNavbarItems } from "../../Constants/navigation";

type Props = {};

const SettingsNavbar = (props: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      {settingsNavbarItems.map((navbarItem) => (
        <NavbarLink
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
