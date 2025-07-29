import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink } from "react-router";

type Props = {
  to: string;
  label: string;
  icon?: any;
};

const NavbarLink = ({ to, label, icon }: Props) => {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "text-[#2B9AE9] bg-[#D7EEFF]/50 text-[20px] p-2 block rounded-[10px] my-2"
          : "text-[#535353] text-[20px] p-2 block my-2"
      }
      to={to}
    >
      {icon && <FontAwesomeIcon icon={icon} />}
      <span className="pl-4">{label}</span>
    </NavLink>
  );
};

export default NavbarLink;
