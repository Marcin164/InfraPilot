import { useQuery } from "@tanstack/react-query";
import Equipment from "../../../Components/Details/Equipment";
import EquipmentHistory from "../../../Components/Details/EquipmentHistory";
import FormsList from "../../../Components/Details/FormsList";
import Groups from "../../../Components/Details/Groups";
import UserInfo from "../../../Components/Details/UserInfo";
import { getUser } from "../../../Services/users";
import { useParams } from "react-router";
import { getDevicesByOwner } from "../../../Services/devices";

type Props = {};

const Details = (props: Props) => {
  const params: any = useParams();
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser("", params.id),
  });

  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner("", params.id),
  });

  console.log(userDevices.data);

  if (!userQuery?.data) return null;

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-3 gap-y-1 gap-x-4 p-4">
      <UserInfo {...userQuery.data} />
      <Equipment devices={userDevices.data} userId={params.id} />
      <EquipmentHistory />
      <Groups groups={userQuery?.data?.memberOf || []} />
      <FormsList />
    </div>
  );
};

export default Details;
