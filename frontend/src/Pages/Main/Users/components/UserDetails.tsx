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
import Badge from "../../../../Components/Badges/Badge";
import Parameter from "../../../../Components/Lists/Parameter";
import UserDetailsDropdown from "../../../../Components/Dropdowns/UserDetailsDropdown";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import PrivacyDialog from "../../../../Components/Modals/PrivacyDialog";
import AuthLinkPanel from "./AuthLinkPanel";
import { useCurrentUser } from "../../../../Hooks/useCurrentUser";

type Props = { data: any };

const UserDetails = ({ data }: Props) => {
  const { t } = useTranslation();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const currentUserQuery = useCurrentUser();

  const canViewAsDpo = Boolean(
    currentUserQuery.data?.isDpo || currentUserQuery.data?.isAdmin,
  );

  const initials =
    `${data.name?.[0] ?? ""}${data.surname?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className="w-[64px] h-[64px] rounded-full bg-[#2B9AE9] flex items-center justify-center flex-shrink-0 text-white font-bold text-[22px] select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-extrabold text-[#3C3C3C] text-[18px] leading-tight">
                {`${data.name} ${data.surname}`}
              </div>
              {data.title && (
                <div className="text-[#9a9a9a] text-[13px] pb-1">{data.title}</div>
              )}
              <div
                className={twMerge(
                  "text-[13px] flex items-center gap-1 mt-1",
                  data.enabled ? "text-[#30A712]" : "text-[#BC0E0E]",
                )}
              >
                <FontAwesomeIcon icon={data.enabled ? faCheckCircle : faXmarkCircle} />
                {data.enabled ? t("users.details.enabled") : t("users.details.disabled")}
              </div>
            </div>
            <UserDetailsDropdown data={data} />
          </div>
        </div>
      </div>

      {/* Department badge + DPO button */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {data.department && (
          <Badge className="bg-[#2B9AE9]" text={data.department} icon={faUserDoctor} />
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

      {/* Contact / info fields */}
      <div className="mt-3 divide-y divide-[#F5F5F5]">
        {data.manager && <Parameter name={t("user.manager")} value={data.manager} />}
        {data.email && <Parameter name={t("user.email")} value={data.email} />}
        {data.phone && <Parameter name={t("user.phone")} value={data.phone} />}
        {data.streetAddress && data.postalCode && data.city && (
          <Parameter
            name={t("user.address")}
            value={`${data.streetAddress}, ${data.postalCode} ${data.city}`}
          />
        )}
        {data.company && <Parameter name={t("user.company")} value={data.company} />}
      </div>

      {(currentUserQuery.data?.isAdmin || canViewAsDpo) && (
        <AuthLinkPanel user={data} />
      )}
    </div>
  );
};

export default UserDetails;
