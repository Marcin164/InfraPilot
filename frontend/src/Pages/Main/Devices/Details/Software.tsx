import { useState } from "react";
import { useTranslation } from "react-i18next";
import SoftwareTable from "../../../../Components/Tables/SoftwareTable";
import { useOutletContext } from "react-router";
import { twMerge } from "tailwind-merge";
import AppxTable from "../../../../Components/Tables/AppxTable";
import FeaturesTable from "../../../../Components/Tables/FeaturesTable";
import NoData from "../components/NoData";

const TABS = [1, 2, 3] as const;
type TabId = (typeof TABS)[number];

const Software = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const [activeTab, setActiveTab] = useState<TabId>(1);

  if (!device?.data?.software) return <NoData />;

  const softwareInfo = device.data.software;

  const counts: Record<TabId, number> = {
    1: (softwareInfo.installed_programs ?? []).length,
    2: (softwareInfo.appx_packages ?? []).length,
    3: (softwareInfo.windows_features ?? []).length,
  };

  const tabLabels: Record<TabId, string> = {
    1: t("device.section.applications"),
    2: t("device.section.appx"),
    3: t("device.section.features"),
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 1:
        return <SoftwareTable data={softwareInfo.installed_programs} />;
      case 2:
        return <AppxTable data={softwareInfo.appx_packages} />;
      case 3:
        return <FeaturesTable data={softwareInfo.windows_features} />;
    }
  };

  return (
    <div className="w-full">
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
    </div>
  );
};

export default Software;
