import React from "react";
import SoftwareTable from "../../../../Components/Tables/SoftwareTable";
import { useOutletContext } from "react-router";

type Props = {};

const Software = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.scanInfo) return null;

  const softwareInfo = device.data.scanInfo.software_info;
  return (
    <div className="w-full ">
      <SoftwareTable data={softwareInfo} />
    </div>
  );
};

export default Software;
