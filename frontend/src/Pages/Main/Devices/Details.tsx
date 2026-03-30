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
  const { setParser } = useParser();

  const deviceQuery = useQuery({
    queryKey: ["device"],
    queryFn: () => getDevice(params.id!),
  });

  useEffect(() => {
    setParser({
      id: deviceQuery?.data?.id,
      name: deviceQuery?.data?.assetName,
    });

    return () => {};
  }, [deviceQuery?.data?.id, setParser]);

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
