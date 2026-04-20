import UserDetails from "./UserDetails";
import UserForms from "./UserForms";
import UserPrivileges from "./UserPrivileges";

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
      <UserForms />
    </div>
  );
};

export default UserInfo;
