import { useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { useOutletContext } from "react-router";
import LocalUsersTable from "../../../../Components/Tables/LocalUsersTable";
import LocalGroupsTable from "../../../../Components/Tables/LocalGroupsTable";
import UsersProfilesTable from "../../../../Components/Tables/UsersProfilesTable";
import NoData from "../components/NoData";

type Props = {};

const UsersInfo = (props: Props) => {
  const { t } = useTranslation();
  const device: any = useOutletContext();

  if (!device.data.users) return <NoData />;

  const usersInfo = device.data.users;

  const [usersGroupType, setUsersGroupType] = useState(1);

  const toggleUsersGroupType = (type: number) => {
    setUsersGroupType(() => type);
  };

  return (
    <>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text={t("device.section.localUsers")}
          onClick={() => toggleUsersGroupType(1)}
        />
        <ButtonPrimary
          text={t("device.section.localGroups")}
          onClick={() => toggleUsersGroupType(2)}
        />
        <ButtonPrimary
          text={t("device.section.usersProfiles")}
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
