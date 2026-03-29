import React, { useState } from "react";
import Connections from "../components/Connections";
import { useOutletContext } from "react-router";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import FirewallRulesTable from "../../../../Components/Tables/FirewallRulesTable";
import IPv4 from "../components/IPv4";
import IPv6 from "../components/IPv6";
import DNS from "../components/DNS";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faPlug,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import NoData from "../components/NoData";

type Props = {};

const Network = (props: Props) => {
  const device: any = useOutletContext();
  const [networkInfoType, setNetworkInfoType] = useState(1);

  if (!device?.data?.network) return <NoData />;

  const networkInfo = device.data.network;

  const networkAdaptersInfo = networkInfo.nic_config.map((nic: any) => {
    const adapter = networkInfo.adapters[nic.InterfaceAlias];
    if (adapter && Array.isArray(adapter)) {
      const netmaskEntry = adapter.find((a) => a.netmask !== null);
      if (netmaskEntry) {
        nic.NetMask = netmaskEntry.netmask;
      }
    }
    return nic;
  });

  const toggleNetworkInfo = (type: any) => {
    setNetworkInfoType(type);
  };

  const setPanel = (type: any) => {
    let panel = <></>;

    switch (type) {
      case 1:
        panel = <Connections connections={networkInfo.connections} />;
        break;

      case 2:
        panel = (
          <div className="w-full">
            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
            >
              <Masonry>
                {networkAdaptersInfo.map((adapter: any) => (
                  <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
                    <div className="text-[20px] font-semibold text-[#3C3C3C]">
                      {adapter.InterfaceAlias}
                    </div>
                    <div className="text-[14px] font-light text-[#3C3C3C]">
                      {adapter.InterfaceDescription}
                    </div>
                    <div className="flex">
                      <div className="w-fit mr-2 px-2 rounded-[5px] text-[14px] mt-2 text-center bg-[#2B9AE9] text-[#FFFFFF]">
                        <FontAwesomeIcon icon={faGauge} />
                        <span className="ml-1">{`${adapter["Speed(Mbps)"]} Mbps`}</span>
                      </div>
                      <div
                        className={twMerge(
                          "w-fit mr-2 px-2 rounded-[5px] text-[14px] mt-2 text-center text-[#FFFFFF]",
                          adapter.Connected ? "bg-[#30A712]" : "bg-[#F3606A]",
                        )}
                      >
                        <FontAwesomeIcon
                          icon={adapter.Connected ? faPlug : faPlugCircleXmark}
                        />
                        <span className="ml-1">
                          {adapter.Connected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                      <div className="w-fit mr-2 px-2 rounded-[5px] text-[14px] mt-2 text-center bg-[#AFBA17] text-[#FFFFFF]">
                        {adapter.DHCP === 1 ? "DHCP" : "Static"}
                      </div>
                    </div>
                    <IPv4 {...adapter} />
                    <IPv6 {...adapter} />
                    <DNS servers={adapter.DNSServers.value} />
                    <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
                      Physical Address
                    </div>
                    <div className="text-[#3C3C3C] font-semibold">
                      {adapter.MAC}
                    </div>
                  </div>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        );
        break;
      case 3:
        panel = <FirewallRulesTable data={networkInfo.firewall_rules} />;
        break;
    }

    return panel;
  };

  return (
    <div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text="Connections"
          onClick={() => toggleNetworkInfo(1)}
        />
        <ButtonPrimary text="Adapters" onClick={() => toggleNetworkInfo(2)} />
        <ButtonPrimary
          text="Firewall Rules"
          onClick={() => toggleNetworkInfo(3)}
        />
        <ButtonPrimary
          text="Mapped Drives"
          onClick={() => toggleNetworkInfo(4)}
        />
        <ButtonPrimary text="Shares" onClick={() => toggleNetworkInfo(5)} />
      </div>
      <div>{setPanel(networkInfoType)}</div>
    </div>
  );
};

export default Network;
