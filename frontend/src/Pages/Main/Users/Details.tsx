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
  return (
    <PageMotion>
      {/* 1 col mobile → 2 cols tablet → 3 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 items-start">
        <UserInfo data={userQuery.data} />
        <Equipment devices={userDevices.data} />
        {/* span 2 cols on tablet so it fills the row; reset to 1 on xl */}
        <div className="md:col-span-2 xl:col-span-1">
          <EquipmentHistory />
        </div>
      </div>
    </PageMotion>
  );
};

export default Details;
