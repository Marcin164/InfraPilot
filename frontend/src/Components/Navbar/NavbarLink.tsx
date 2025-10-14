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
          ? "text-[#2B9AE9] bg-[#D7EEFF]/50 text-[16px] px-2 py-[1px] block rounded-[10px]"
          : "text-[#535353] text-[16px] px-2 py-[1px] block"
      }
      to={to}
    >
      <div className={`${alignment == "horizontal" ? "my-2" : "mx-1"}`}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            className={`${alignment == "horizontal" && "w-[20px]"}`}
          />
        )}
        <span className="pl-4">{label}</span>
      </div>
    </NavLink>
  );
};

export default NavbarLink;
