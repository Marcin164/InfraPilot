import UserPrivileges from "./UserPrivileges";
import UserForms from "./UserForms";
import UserGroups from "./UserGroups";
import UserDetails from "./UserDetails";

type Props = {
  data: any;
};

const UserInfo = ({ data }: Props) => {
  return (
    <div className="w-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <UserDetails data={data} />
      <UserPrivileges
        data={{
          isAdmin: Boolean(data?.isAdmin),
          isApprover: Boolean(data?.isApprover),
          isAuditor: Boolean(data?.isAuditor),
          isCompliance: Boolean(data?.isCompliance),
          isHelpdesk: Boolean(data?.isHelpdesk),
          isDpo: Boolean(data?.isDpo),
        }}
      />
      <UserGroups memberOf={data?.memberOf} />
      <UserForms />
    </div>
  );
};

export default UserInfo;
