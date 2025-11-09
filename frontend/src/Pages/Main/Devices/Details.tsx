import { useEffect } from "react";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevice } from "../../../Services/devices";
import { useParser } from "../../../Hooks/useParser";
import { useAuthInfo } from "@propelauth/react";
import DataLoader from "../../../Components/Loaders/DataLoader";

type Props = {};

const Details = (props: Props) => {
  const params = useParams();
  const { setParser } = useParser();

  const authInfo = useAuthInfo();

  const deviceQuery = useQuery({
    queryKey: ["device"],
    queryFn: () => getDevice(authInfo.accessToken, params.id),
  });

  useEffect(() => {
    setParser({
      id: deviceQuery?.data?.id,
      name: deviceQuery?.data?.assetName,
    });

    return () => {};
  }, [deviceQuery?.data?.id, setParser]);

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
