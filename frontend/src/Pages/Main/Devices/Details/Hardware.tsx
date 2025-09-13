import React from "react";
import { useOutletContext } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import CPU from "../../../../Components/Details/CPU";
import RAM from "../../../../Components/Details/RAM";
import MOBO from "../../../../Components/Details/MOBO";
import Disks from "../../../../Components/Details/Disks";
import GPU from "../../../../Components/Details/GPU";
import BIOS from "../../../../Components/Details/BIOS";

type Props = {};

const SystemInfo = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.scanInfo) return null;

  const hardwareInfo = device.data.scanInfo.hardware_info;

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <Disks disks={hardwareInfo.disks} />
          <CPU cpus={hardwareInfo.cpu} />
          <RAM rams={hardwareInfo.ram_modules} />
          <MOBO baseboard={hardwareInfo.baseboard} />
          <GPU gpus={hardwareInfo.gpus} />
          <BIOS bios={hardwareInfo.bios} />
        </Masonry>
      </ResponsiveMasonry>
      {/* <CPU cpus={hardwareInfo.cpu} />
      <RAM rams={hardwareInfo.ram_modules} />
      <MOBO baseboard={hardwareInfo.baseboard} />
      <BIOS bios={hardwareInfo.bios} />
      <Disks disks={hardwareInfo.disks} />
      <GPU gpus={hardwareInfo.gpus} /> */}
    </div>
  );
};

export default SystemInfo;
