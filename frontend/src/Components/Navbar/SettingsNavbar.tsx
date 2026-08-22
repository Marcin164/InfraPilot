import React from "react";
import { useTranslation } from "react-i18next";
import NavbarLink from "./NavbarLink";
import { settingsNavbarItems, canSeeItem } from "../../Constants/navigation";
import { useCurrentUser } from "../../Hooks/useCurrentUser";

const SettingsNavbar = () => {
  const { t } = useTranslation();
  const currentUserQuery = useCurrentUser();

  const visibleItems = settingsNavbarItems.filter((item) =>
    canSeeItem(item, currentUserQuery.data),
  );

  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-nav">
      {visibleItems.map((navbarItem) => (
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
