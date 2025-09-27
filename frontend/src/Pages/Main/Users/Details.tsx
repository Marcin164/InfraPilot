import { useQuery } from "@tanstack/react-query";
import Equipment from "../../../Components/Details/Equipment";
import EquipmentHistory from "../../../Components/Details/EquipmentHistory";
import UserInfo from "../../../Components/Details/UserInfo";
import { getUser } from "../../../Services/users";
import { useParams } from "react-router";
import { getDevicesByOwner } from "../../../Services/devices";

const Details = () => {
  const params: any = useParams();
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser("", params.id),
  });

  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner("", params.id),
  });

  if (!userQuery?.data) return null;

  console.log(userQuery.data);

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
