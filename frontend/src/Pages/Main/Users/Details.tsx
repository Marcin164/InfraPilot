import { useQuery } from "@tanstack/react-query";
import Equipment from "./components/Equipment";
import EquipmentHistory from "./components/EquipmentHistory";
import UserInfo from "./components/UserInfo";
import { getUser } from "../../../Services/users";
import { useParams } from "react-router";
import { getDevicesByOwner } from "../../../Services/devices";
import { useEffect } from "react";
import { useParser } from "../../../Hooks/useParser";
import PageMotion from "../../../Components/PageMotion/PageMotion";

const Details = () => {
  const params: any = useParams();
  const { setParsers } = useParser();

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(params.id),
  });

  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner(params.id),
  });

  useEffect(() => {
    if (userQuery?.data?.id) {
      setParsers({
        [userQuery.data.id]: `${userQuery.data.name} ${userQuery.data.surname}`,
      });
    }
    return () => setParsers({});
  }, [userQuery?.data?.id, setParsers]);

  if (!userQuery?.data) return null;

  console.log(userQuery?.data);
  return (
    <PageMotion>
      <div className="grid grid-cols-3 gap-x-4 p-4">
        <UserInfo data={userQuery.data} />
        <Equipment devices={userDevices.data} />
        <EquipmentHistory />
      </div>
    </PageMotion>
  );
};

export default Details;
