import { useOutletContext } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import System from "../components/OS";
import AD from "../components/AD";
import AgentCredentials from "../components/AgentCredentials";
import NoData from "../components/NoData";

type Props = {};

const SystemInfo = ({}: Props) => {
  const device: any = useOutletContext();

  if (!device?.data?.system) return <NoData />;

  const systemInfo = device.data.system;
  const deviceData = device.data;

  return (
    <div className="w-full cursor-default ">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry className="scrollbar-hide w-full h-[82vh] overflow-y-scroll pb-4">
          <System systemInfo={systemInfo} />
          <AD />
          <AgentCredentials
            deviceId={deviceData.id}
            lastScanAt={deviceData.lastScanAt}
            apiSecretRotatedAt={deviceData.apiSecretRotatedAt}
            apiSecretPrevValidUntil={deviceData.apiSecretPrevValidUntil}
          />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default SystemInfo;
