import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEffect } from "react";
import { useParser } from "../../../Hooks/useParser";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { getUser } from "../../../Services/users";
import { getDevicesByOwner } from "../../../Services/devices";
import UserDetails from "./components/UserDetails";
import UserPrivileges from "./components/UserPrivileges";
import UserGroups from "./components/UserGroups";
import UserForms from "./components/UserForms";
import Equipment from "./components/Equipment";
import EquipmentHistory from "./components/EquipmentHistory";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 items-start">
        {/* Left column: identity */}
        <div className="flex flex-col gap-4">
          <UserDetails data={userQuery.data} />
          <UserPrivileges
            data={{ isApprover: userQuery.data.isApprover, isAdmin: userQuery.data.isAdmin }}
          />
          <UserGroups memberOf={userQuery.data.memberOf} />
        </div>

        {/* Middle column: equipment */}
        <Equipment devices={userDevices.data} />

        {/* Right column: history + forms */}
        <div className="flex flex-col gap-4">
          <EquipmentHistory />
          <UserForms />
        </div>
      </div>
    </PageMotion>
  );
};

export default Details;
