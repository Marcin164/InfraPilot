import React from "react";
import NavbarLink from "./NavbarLink";
import { navbarItems } from "../../Constants/navigation";
import { useLogoutFunction } from "@propelauth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/Logo.png";
import { useTranslation } from "react-i18next";

type Props = {};

const MainNavbar = (props: Props) => {
  const logout = useLogoutFunction();
  const { t } = useTranslation();

  return (
    <div className="w-[240px] h-screen bg-[#FFFFFF] px-2 flex flex-col justify-between">
      <div>
        <img src={Logo} className="p-2 rounded" />
        {navbarItems.map((navbarItem) => (
          <NavbarLink
            to={navbarItem.to}
            label={t(navbarItem.label)}
            icon={navbarItem.icon}
          />
        ))}
      </div>
      <div>
        <button
          className="text-[#535353] text-[16px] px-2 py-4 block cursor-pointer"
          onClick={() => logout(false)}
        >
          <FontAwesomeIcon icon={faSignOut} />
          <span className="pl-4">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default MainNavbar;
