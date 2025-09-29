import { useQuery } from "@tanstack/react-query";
import Equipment from "../../../Components/Details/Equipment";
import EquipmentHistory from "../../../Components/Details/EquipmentHistory";
import UserInfo from "../../../Components/Details/UserInfo";
import { getUser } from "../../../Services/users";
import { useParams } from "react-router";
import { getDevicesByOwner } from "../../../Services/devices";
import { useEffect } from "react";
import { useParser } from "../../../Hooks/useParser";

const Details = () => {
  const params: any = useParams();
  const { setParser } = useParser();
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser("", params.id),
  });

  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner("", params.id),
  });

  useEffect(() => {
    setParser({ id: userQuery?.data?.id, name: userQuery?.data?.displayName });
  }, [userQuery?.data?.id, setParser]);

  if (!userQuery?.data) return null;

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-3 gap-x-4 p-4">
      <UserInfo {...userQuery.data} />
      <Equipment
        devices={userDevices.data}
        userId={Number.parseInt(params.id)}
      />
      <EquipmentHistory />
    </div>
  );
};

export default Details;
