import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink } from "react-router";

type Props = {
  to: string;
  label: string;
  icon?: any;
  alignment?: string;
};

const NavbarLink = ({ to, label, icon, alignment = "horizontal" }: Props) => {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "text-[#2B9AE9] bg-[#D7EEFF]/50 text-[20px] p-2 block rounded-[10px]"
          : "text-[#535353] text-[20px] p-2 block"
      }
      to={to}
    >
      <div className={`${alignment == "horizontal" ? "my-2" : "mx-2"}`}>
        {icon && <FontAwesomeIcon icon={icon} />}
        <span className="pl-4">{label}</span>
      </div>
    </NavLink>
  );
};

export default NavbarLink;
