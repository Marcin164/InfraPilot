import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import NavbarLink from "./NavbarLink";
import {
  reportsNavbarItems,
  reportPageCategories,
  canSeeItem,
} from "../../Constants/navigation";
import { listReports } from "../../Services/reports";
import { usePermissions } from "../../Hooks/usePermissions";

const ReportsNavbar = () => {
  const { t } = useTranslation();
  const permissionsQuery = usePermissions();
  // listReports() itself needs audit.fullAccess/devices.complianceRules.manage
  // (see reports.controller.ts) -- a plain user without either 403s here, so
  // `data` stays undefined. That's not "no report data", it's "can't ask" --
  // canSeeItem below is what actually decides visibility per tab; this query
  // only further hides a tab that has no data for its categories yet.
  const { data } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: listReports,
    staleTime: 5 * 60 * 1000,
  });

  const visible = reportsNavbarItems.filter((item) => {
    if (!canSeeItem(item, permissionsQuery.data)) return false;
    if (!data) return true;
    const categories = reportPageCategories[item.to] ?? [];
    return data.some((r) => categories.includes(r.category));
  });

  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-nav">
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
