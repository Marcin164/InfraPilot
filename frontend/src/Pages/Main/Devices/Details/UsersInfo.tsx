import React, { useState } from "react";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { useOutletContext } from "react-router";
import LocalUsersTable from "../../../../Components/Tables/LocalUsersTable";
import LocalGroupsTable from "../../../../Components/Tables/LocalGroupsTable";
import UsersProfilesTable from "../../../../Components/Tables/UsersProfilesTable";

type Props = {};

const UsersInfo = (props: Props) => {
  const device: any = useOutletContext();

  if (!device.data.users) return null;

  const usersInfo = device.data.users;

  const [usersGroupType, setUsersGroupType] = useState(1);

  const toggleUsersGroupType = (type: number) => {
    setUsersGroupType(() => type);
  };
  return (
    <>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text="Local Users"
          onClick={() => toggleUsersGroupType(1)}
        />
        <ButtonPrimary
          text="Local Groups"
          onClick={() => toggleUsersGroupType(2)}
        />
        <ButtonPrimary
          text="Users Profiles"
          onClick={() => toggleUsersGroupType(3)}
        />
      </div>
      {usersGroupType === 1 && <LocalUsersTable data={usersInfo.local_users} />}
      {usersGroupType === 2 && (
        <LocalGroupsTable data={usersInfo.local_groups} />
      )}
      {usersGroupType === 3 && (
        <UsersProfilesTable data={usersInfo.users_profiles} />
      )}
    </>
  );
};

export default UsersInfo;
