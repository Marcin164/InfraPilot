import { useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import EventsTable from "../../../../Components/Tables/EventsTable";
import { useOutletContext } from "react-router";
import NoData from "../components/NoData";

const TABS = ["System", "Application", "Security"] as const;
type TabId = (typeof TABS)[number];

const Events = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const [activeTab, setActiveTab] = useState<TabId>("System");

  if (!device?.data?.eventLogs) return <NoData />;

  const eventLogs = device.data.eventLogs;

  const tabLabels: Record<TabId, string> = {
    System: t("device.section.eventsSystem"),
    Application: t("device.section.eventsApplication"),
    Security: t("device.section.eventsSecurity"),
  };

  return (
    <div>
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
              {tabLabels[tab]} ({(eventLogs[tab] ?? []).length})
            </button>
          ))}
        </div>
      </div>
      <EventsTable data={eventLogs[activeTab]} />
    </div>
  );
};

export default Events;
