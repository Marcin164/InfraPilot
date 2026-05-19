import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import NavbarLink from "./NavbarLink";
import {
  reportsNavbarItems,
  reportPageCategories,
} from "../../Constants/navigation";
import { listReports } from "../../Services/reports";

const ReportsNavbar = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    staleTime: 5 * 60 * 1000,
  });

  const visible = reportsNavbarItems.filter((item) => {
    if (!data) return true;
    const categories = reportPageCategories[item.to] ?? [];
    return data.some((r) => categories.includes(r.category));
  });

  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-hide">
      {visible.map((navbarItem) => (
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

export default ReportsNavbar;
