import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useParams } from "react-router";
import { getApplication } from "../../../Services/applications";
import Parameter from "../../../Components/Lists/Parameter";
import InstalledOnTable from "../../../Components/Tables/InstalledOnTable";
import { getDevicesWithApplication } from "../../../Services/devices";

type Props = {};

const Details = (props: Props) => {
  const params: any = useParams();
  const applicationQuery = useQuery({
    queryKey: ["application"],
    queryFn: () => getApplication("", params.id),
  });

  const devicesWithApplicationQuery = useQuery({
    queryKey: ["devicesWithApplication"],
    queryFn: () => getDevicesWithApplication("", params.id),
  });

  if (!applicationQuery?.data) return null;

  console.log(devicesWithApplicationQuery?.data);
  const app = applicationQuery?.data;

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-2 gap-x-4 p-4">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">
          {app.name}
        </div>
        <div className="text-[#B3B3B3] text-[18px] pb-2">{app.publisher}</div>
        <Parameter name="Size" value={app.size} />
        <Parameter name="Version" value={app.version} />
      </div>
      <div>
        <div className="w-full h-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
          <div className="text-[30px] font-semibold text-[#3C3C3C]">
            Installed on
          </div>
          <InstalledOnTable data={devicesWithApplicationQuery?.data} />
        </div>
      </div>
    </div>
  );
};

export default Details;
