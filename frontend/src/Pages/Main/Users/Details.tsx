import { useQuery } from "@tanstack/react-query";
import Equipment from "../../../Components/Details/Users/Equipment";
import EquipmentHistory from "../../../Components/Details/Users/EquipmentHistory";
import UserInfo from "../../../Components/Details/Users/UserInfo";
import { getUser } from "../../../Services/users";
import { useParams } from "react-router";
import { getDevicesByOwner } from "../../../Services/devices";
import { useEffect } from "react";
import { useParser } from "../../../Hooks/useParser";
import { useAuthInfo } from "@propelauth/react";
import PageMotion from "../../../Components/PageMotion/PageMotion";

const Details = () => {
  const params: any = useParams();
  const { setParser } = useParser();

  const authInfo = useAuthInfo();

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(authInfo.accessToken, params.id),
  });

  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner(authInfo.accessToken, params.id),
  });

  useEffect(() => {
    setParser({
      id: userQuery?.data?.id,
      name:
        userQuery?.data &&
        `${userQuery?.data?.name} ${userQuery?.data?.surname}`,
    });
  }, [userQuery?.data?.id, setParser]);

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
