import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { memberOf: any };

const UserGroups = ({ memberOf }: Props) => {
  const { t } = useTranslation();

  const groups: string[] =
    memberOf && typeof memberOf !== "string" ? memberOf : [];

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.groups")} icon={faUserGroup} />
      <div className="mt-3 flex flex-wrap gap-2">
        {groups.length > 0 ? (
          groups.map((group) => (
            <span
              key={group}
              className="rounded-full bg-[#EEF5FD] text-[#2B9AE9] text-[12px] font-semibold px-3 py-1"
            >
              {group}
            </span>
          ))
        ) : (
          <div className="text-[13px] text-[#9a9a9a]">{t("users.groups.empty")}</div>
        )}
      </div>
    </div>
  );
};

export default UserGroups;
