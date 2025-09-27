import React, { useState } from "react";
import Connections from "../../../../Components/Details/Connections";
import { useOutletContext } from "react-router";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Interfaces from "../../../../Components/Details/Interfaces";
import NetworkStats from "../../../../Components/Details/NetworkStats";

type Props = {};

const Network = (props: Props) => {
  const device: any = useOutletContext();
  const [networkInfoType, setNetworkInfoType] = useState(1);
  if (!device?.data?.network) return null;

  const networkInfo = device.data.network;

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
            <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2 }}>
              <Masonry>
                <Interfaces interfaces={networkInfo.interfaces} />
                <NetworkStats stats={networkInfo.stats} />
              </Masonry>
            </ResponsiveMasonry>
          </div>
        );
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
        <ButtonPrimary text="Details" onClick={() => toggleNetworkInfo(2)} />
      </div>
      <div>{setPanel(networkInfoType)}</div>
    </div>
  );
};

export default Network;
