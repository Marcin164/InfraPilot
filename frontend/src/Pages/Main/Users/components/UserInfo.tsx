import UserPrivileges from "./UserPrivileges";
import UserForms from "./UserForms";
import UserGroups from "./UserGroups";
import UserDetails from "./UserDetails";

type Props = {
  data: any;
};

const UserInfo = ({ data }: Props) => {
  console.log(data);
  return (
    <div className="w-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <UserDetails data={data} />
      <UserPrivileges
        data={{ isApprover: data?.isApprover, isAdmin: data?.isAdmin }}
      />
      <UserGroups memberOf={data?.memberOf} />
      <UserForms />
    </div>
  );
};

export default UserInfo;
