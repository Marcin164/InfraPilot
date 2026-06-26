import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink, useLocation } from "react-router";

type Props = {
  to: string;
  label: string;
  icon?: any;
  alignment?: string;
  onNavigate?: () => void;
};

const NavbarLink = ({ to, label, icon, alignment = "horizontal", onNavigate }: Props) => {
  const { pathname } = useLocation();
  // `to` may point at a default sub-tab (e.g. /admin/settings/personal).
  // Stay highlighted for any sibling tab under the same section
  // (e.g. /admin/settings/audit), not just the exact default path.
  const sectionPath = to.split("/").slice(0, 3).join("/");
  const inSection =
    pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);

  return (
    <NavLink
      className={({ isActive }) =>
        isActive || inSection
          ? "text-[#2B9AE9] bg-[#D7EEFF]/50 text-[16px] px-2 py-[1px] block rounded-[10px]"
          : "text-[#535353] text-[16px] px-2 py-[1px] block"
      }
      to={to}
      onClick={onNavigate}
    >
      <div className={`${alignment === "horizontal" ? "my-2" : "mx-1"} whitespace-nowrap`}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            className={`${alignment === "horizontal" ? "w-[20px]" : ""}`}
          />
        )}
        <span className="pl-4">{label}</span>
      </div>
    </NavLink>
  );
};

export default NavbarLink;
