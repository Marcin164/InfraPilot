import { useState } from "react";
import {
  faCheckCircle,
  faUserDoctor,
  faUserShield,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import Badge from "../../../../Components/Badges/Badge";
import Parameter from "../../../../Components/Lists/Parameter";
import UserDetailsDropdown from "../../../../Components/Dropdowns/UserDetailsDropdown";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import PrivacyDialog from "../../../../Components/Modals/PrivacyDialog";
import { getUser } from "../../../../Services/users";

type Props = {
  data: any;
};

const UserDetails = ({ data }: Props) => {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const canViewAsDpo = Boolean(
    currentUserQuery.data?.isDpo || currentUserQuery.data?.isAdmin,
  );
  return (
    <div>
      <div className="flex justify-between">
        <div className="flex items-center">
          <img src="#" className="w-[85px] h-[85px]" />
          <div className="px-4">
            <div className="font-extrabold text-[#3C3C3C] text-[20px]">
              {`${data.name} ${data.surname}`}
            </div>
            <div className="text-[#3C3C3C] font-light text-[15px] pb-2">
              {data.title}
            </div>
            <div
              className={twMerge(
                "text-[18px]",
                data.enabled ? "text-[#30A712]" : "text-[#BC0E0E]",
              )}
            >
              <FontAwesomeIcon
                icon={data.enabled ? faCheckCircle : faXmarkCircle}
              />
              <span className="px-2">
                {data.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
        <UserDetailsDropdown data={data} />
      </div>
      <div className="flex py-3 items-center gap-2">
        {data.department && (
          <Badge
            className="bg-[#2B9AE9]"
            text={data.department}
            icon={faUserDoctor}
          />
        )}
        {canViewAsDpo && (
          <ButtonPrimary
            icon={faUserShield}
            text="View as DPO"
            onClick={() => setPrivacyOpen(true)}
            className="ml-auto text-[13px] py-0.5"
          />
        )}
      </div>
      {canViewAsDpo && (
        <PrivacyDialog
          isOpen={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
          userId={data.id}
          userLabel={`${data.name ?? ""} ${data.surname ?? ""}`.trim()}
        />
      )}
      <div>
        {data.manager && <Parameter name="manager" value={data.manager} />}
        {data.email && <Parameter name="email" value={data.email} />}
        {data.phone && <Parameter name="phone" value={data.phone} />}
        {data.streetAddress && data.postalCode && data.city && (
          <Parameter
            name="address"
            value={`${data.streetAddress}, ${data.postalCode} ${data.city}`}
          />
        )}
        {data.company && <Parameter name="company" value={data.company} />}
      </div>
    </div>
  );
};

export default UserDetails;
