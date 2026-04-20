import { useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { getUser } from "../../../Services/users";
import { getDevicesByOwner } from "../../../Services/devices";
import { getUserForms, type FormItem } from "../../../Services/forms";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import AccountInfo from "./components/AccountInfo";
import AccountEquipment from "./components/AccountEquipment";
import AccountForms from "./components/AccountForms";

const Account = () => {
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const userQuery = useQuery({
    queryKey: ["user-account", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const devicesQuery = useQuery({
    queryKey: ["user-account-devices", currentUserId],
    queryFn: () => getDevicesByOwner(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const formsQuery = useQuery<FormItem[]>({
    queryKey: ["user-account-forms", currentUserId],
    queryFn: () => getUserForms(currentUserId),
    enabled: Boolean(currentUserId),
  });

  if (!currentUserId) return null;
  if (!userQuery.data) {
    return <div className="p-6 text-[#535353]">Loading…</div>;
  }

  return (
    <PageMotion>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <AccountInfo data={userQuery.data} />
        <AccountEquipment
          devices={devicesQuery.data ?? []}
          userId={currentUserId}
        />
        <AccountForms forms={formsQuery.data ?? []} />
      </div>
    </PageMotion>
  );
};

export default Account;
