import { useEffect } from "react";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevice } from "../../../Services/devices";
import { useParser } from "../../../Hooks/useParser";
import DataLoader from "../../../Components/Loaders/DataLoader";

type Props = {};

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
    if (location.pathname === `/devices/${deviceQuery?.data?.id}`)
      navigate("system");
  }, [location.pathname]);

  if (deviceQuery.isLoading) return <DataLoader />;

  return (
    <div className="w-full p-4">
      <DeviceNavbar />
      <div className="py-4 w-full">
        <Outlet context={deviceQuery} />
      </div>
    </div>
  );
};

export default Details;
