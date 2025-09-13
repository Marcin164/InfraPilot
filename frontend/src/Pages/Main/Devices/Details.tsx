import React from "react";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevice } from "../../../Services/devices";

type Props = {};

const Details = (props: Props) => {
  const params = useParams();

  const deviceQuery = useQuery({
    queryKey: ["device"],
    queryFn: () => getDevice("", params.id),
  });

  console.log(deviceQuery.data);

  return (
    <div className="w-full h-[calc(100vh-100px)] p-4">
      <DeviceNavbar />
      <div className="py-4 w-full">
        <Outlet context={deviceQuery} />
      </div>
    </div>
  );
};

export default Details;
