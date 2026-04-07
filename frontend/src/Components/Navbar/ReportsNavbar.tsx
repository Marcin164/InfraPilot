import React from "react";
import { useQuery } from "@tanstack/react-query";
import NavbarLink from "./NavbarLink";
import {
  reportsNavbarItems,
  reportPageCategories,
} from "../../Constants/navigation";
import { listReports } from "../../Services/reports";

type Props = {};

const ReportsNavbar = (props: Props) => {
  const { data } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    staleTime: 5 * 60 * 1000,
  });

  // Hide a navbar entry if the backend exposes 0 reports for any of its categories.
  const visible = reportsNavbarItems.filter((item) => {
    if (!data) return true;
    const categories = reportPageCategories[item.to] ?? [];
    return data.some((r) => categories.includes(r.category));
  });

  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      {visible.map((navbarItem) => (
        <NavbarLink
          key={navbarItem.to}
          to={navbarItem.to}
          label={navbarItem.label}
          icon={navbarItem.icon}
          alignment="vertical"
        />
      ))}
    </div>
  );
};

export default ReportsNavbar;
