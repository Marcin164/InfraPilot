import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import { getDevice } from "../../../Services/devices";
import { useParser } from "../../../Hooks/useParser";
import DataLoader from "../../../Components/Loaders/DataLoader";

const Details = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setParsers } = useParser();

  const deviceQuery = useQuery({
    queryKey: ["device"],
    queryFn: () => getDevice(params.id!),
  });

  useEffect(() => {
    if (deviceQuery?.data?.id) {
      setParsers({ [deviceQuery.data.id]: deviceQuery.data.assetName ?? deviceQuery.data.id });
    }
    return () => setParsers({});
  }, [deviceQuery?.data?.id, setParsers]);

  useEffect(() => {
    if (location.pathname === `/admin/devices/${deviceQuery?.data?.id}`) {
      navigate(deviceQuery?.data?.group === "Computers" ? "system" : "overview");
    }
  }, [location.pathname, deviceQuery?.data?.id, deviceQuery?.data?.group]);

  if (deviceQuery.isLoading) return <DataLoader />;

  return (
    <div className="w-full p-4">
      <DeviceNavbar group={deviceQuery.data?.group} />
      <div className="py-4 w-full">
        <Outlet context={deviceQuery} />
      </div>
    </div>
  );
};

export default Details;
