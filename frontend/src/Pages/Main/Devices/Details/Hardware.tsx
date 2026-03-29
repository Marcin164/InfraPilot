import React from "react";
import { useOutletContext } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import CPU from "../components/CPU";
import RAM from "../components/RAM";
import MOBO from "../components/MOBO";
import Disks from "../components/Disks";
import GPU from "../components/GPU";
import BIOS from "../components/BIOS";
import NoData from "../components/NoData";

type Props = {};

const Hardware = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.hardware) return <NoData />;

  const hardwareInfo = device?.data?.hardware;

  return (
    <div className="w-full cursor-default ">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry className="scrollbar-hide w-full h-[82vh] overflow-y-scroll pb-4">
          <Disks disks={hardwareInfo.disks} />
          <CPU cpus={hardwareInfo.cpu} />
          <RAM rams={hardwareInfo.ram_modules} />
          <MOBO baseboard={hardwareInfo.baseboard} />
          <GPU gpus={hardwareInfo.gpus} />
          <BIOS bios={hardwareInfo.bios} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Hardware;
