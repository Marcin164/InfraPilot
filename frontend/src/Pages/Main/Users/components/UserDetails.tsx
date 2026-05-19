import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import AuthLinkPanel from "./AuthLinkPanel";

type Props = {
  data: any;
};

const UserDetails = ({ data }: Props) => {
  const { t } = useTranslation();
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

  const initials =
    `${data.name?.[0] ?? ""}${data.surname?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div>
      {/* ── Avatar + name row ── */}
      <div className="flex items-start gap-3">
        <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-[#2B9AE9] flex items-center justify-center flex-shrink-0 text-white font-bold text-[20px] sm:text-[24px] select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-extrabold text-[#3C3C3C] text-[17px] sm:text-[20px] leading-tight">
                {`${data.name} ${data.surname}`}
              </div>
              <div className="text-[#3C3C3C] font-light text-[13px] sm:text-[15px] pb-1">
                {data.title}
              </div>
              <div
                className={twMerge(
                  "text-[14px] sm:text-[16px]",
                  data.enabled ? "text-[#30A712]" : "text-[#BC0E0E]",
                )}
              >
                <FontAwesomeIcon
                  icon={data.enabled ? faCheckCircle : faXmarkCircle}
                />
                <span className="px-2">
                  {data.enabled
                    ? t("users.details.enabled")
                    : t("users.details.disabled")}
                </span>
              </div>
            </div>
            <UserDetailsDropdown data={data} />
          </div>
        </div>
      </div>

      {/* ── Department badge + DPO button ── */}
      <div className="flex flex-wrap py-3 items-center gap-2">
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
            text={t("users.details.viewAsDpo")}
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

      {/* ── Parameters ── */}
      <div>
        {data.manager && (
          <Parameter name={t("user.manager")} value={data.manager} />
        )}
        {data.email && (
          <Parameter name={t("user.email")} value={data.email} />
        )}
        {data.phone && (
          <Parameter name={t("user.phone")} value={data.phone} />
        )}
        {data.streetAddress && data.postalCode && data.city && (
          <Parameter
            name={t("user.address")}
            value={`${data.streetAddress}, ${data.postalCode} ${data.city}`}
          />
        )}
        {data.company && (
          <Parameter name={t("user.company")} value={data.company} />
        )}
      </div>

      {(currentUserQuery.data?.isAdmin || canViewAsDpo) && (
        <AuthLinkPanel user={data} />
      )}
    </div>
  );
};

export default UserDetails;
