import React from "react";
import { useOutletContext } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import System from "../components/OS";
import AD from "../components/AD";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import NoData from "../components/NoData";

type Props = {};

const SystemInfo = ({}: Props) => {
  const device: any = useOutletContext();

  if (!device?.data?.system) return <NoData />;

  const systemInfo = device.data.system;

  return (
    <div className="w-full cursor-default ">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry className="scrollbar-hide w-full h-[82vh] overflow-y-scroll pb-4">
          <System systemInfo={systemInfo} />
          <AD />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default SystemInfo;
