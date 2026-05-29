import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Connections from "../components/Connections";
import { useOutletContext } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import FirewallRulesTable from "../../../../Components/Tables/FirewallRulesTable";
import IPv4 from "../components/IPv4";
import IPv6 from "../components/IPv6";
import DNS from "../components/DNS";
import NetworkStats from "../components/NetworkStats";
import MappedDrives from "../components/MappedDrives";
import Shares from "../components/Shares";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faPlug,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import NoData from "../components/NoData";

const TABS = [1, 2, 3, 4, 5, 6] as const;
type TabId = (typeof TABS)[number];

const Network = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const [activeTab, setActiveTab] = useState<TabId>(1);

  if (!device?.data?.network) return <NoData />;

  const networkInfo = device.data.network;

  const networkAdaptersInfo = (networkInfo.nic_config ?? []).map((nic: any) => {
    const adapter = networkInfo.adapters?.[nic.InterfaceAlias];
    if (adapter && Array.isArray(adapter)) {
      const netmaskEntry = adapter.find((a: any) => a.netmask !== null);
      if (netmaskEntry) nic.NetMask = netmaskEntry.netmask;
    }
    return nic;
  });

  const tabLabels: Record<TabId, string> = {
    1: t("device.section.connections"),
    2: t("device.section.adapters"),
    3: t("device.section.firewallRules"),
    4: t("device.section.mappedDrives"),
    5: t("device.section.shares"),
    6: t("device.section.networkStats"),
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 1:
        return <Connections connections={networkInfo.connections} />;

      case 2:
        return (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
            <Masonry>
              {networkAdaptersInfo.map((adapter: any, i: number) => (
                <div
                  key={i}
                  className="w-full bg-white shadow-xl rounded-[10px] p-4 mb-4"
                >
                  <div className="text-[20px] font-semibold text-[#3C3C3C]">
                    {adapter.InterfaceAlias}
                  </div>
                  <div className="text-[14px] font-light text-[#3C3C3C]">
                    {adapter.InterfaceDescription}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <div className="px-2 rounded-[5px] text-[14px] text-center bg-[#2B9AE9] text-white">
                      <FontAwesomeIcon icon={faGauge} />
                      <span className="ml-1">{`${adapter["Speed(Mbps)"]} Mbps`}</span>
                    </div>
                    <div
                      className={twMerge(
                        "px-2 rounded-[5px] text-[14px] text-center text-white",
                        adapter.Connected ? "bg-[#30A712]" : "bg-[#F3606A]",
                      )}
                    >
                      <FontAwesomeIcon
                        icon={adapter.Connected ? faPlug : faPlugCircleXmark}
                      />
                      <span className="ml-1">
                        {adapter.Connected
                          ? t("device.network.connected")
                          : t("device.network.disconnected")}
                      </span>
                    </div>
                    <div className="px-2 rounded-[5px] text-[14px] text-center bg-[#AFBA17] text-white">
                      {adapter.DHCP === 1 ? "DHCP" : "Static"}
                    </div>
                  </div>
                  <IPv4 {...adapter} />
                  <IPv6 {...adapter} />
                  <DNS servers={adapter.DNSServers?.value} />
                  <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
                    {t("device.network.physicalAddress")}
                  </div>
                  <div className="text-[#3C3C3C] font-semibold">{adapter.MAC}</div>
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        );

      case 3:
        return <FirewallRulesTable data={networkInfo.firewall_rules} />;

      case 4:
        return <MappedDrives drives={networkInfo.mapped_drives ?? []} />;

      case 5:
        return <Shares shares={networkInfo.shares ?? []} />;

      case 6:
        return networkInfo.net_stats ? (
          <NetworkStats stats={networkInfo.net_stats} />
        ) : (
          <div className="p-4 text-[14px] text-[#9a9a9a]">
            {t("device.network.noStats")}
          </div>
        );
    }
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
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>
      <div>{renderPanel()}</div>
    </div>
  );
};

export default Network;
