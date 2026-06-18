import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { twMerge } from "tailwind-merge";
import LocalUsersTable from "../../../../Components/Tables/LocalUsersTable";
import LocalGroupsTable from "../../../../Components/Tables/LocalGroupsTable";
import UsersProfilesTable from "../../../../Components/Tables/UsersProfilesTable";
import NoData from "../components/NoData";

const TABS = [1, 2, 3] as const;
type TabId = (typeof TABS)[number];

const UsersInfo = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const [activeTab, setActiveTab] = useState<TabId>(1);

  if (!device?.data?.users) return <NoData />;

  const usersInfo = device.data.users;

  const counts: Record<TabId, number> = {
    1: (usersInfo.local_users ?? []).length,
    2: (usersInfo.local_groups ?? []).length,
    3: (usersInfo.users_profiles ?? []).length,
  };

  const tabLabels: Record<TabId, string> = {
    1: t("device.section.localUsers"),
    2: t("device.section.localGroups"),
    3: t("device.section.usersProfiles"),
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 1:
        return <LocalUsersTable data={usersInfo.local_users} />;
      case 2:
        return <LocalGroupsTable data={usersInfo.local_groups} />;
      case 3:
        return <UsersProfilesTable data={usersInfo.users_profiles} />;
    }
  };

  return (
    <>
      <div className="w-full bg-white shadow-xl rounded-[10px] p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={twMerge(
                "px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors",
                activeTab === tab
                  ? "bg-[#2B9AE9] text-white"
                  : "bg-[#F5F7FA] text-[#3C3C3C] hover:bg-[#E8EEF4]",
              )}
            >
              {tabLabels[tab]} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>
      {renderPanel()}
    </>
  );
};

export default UsersInfo;
