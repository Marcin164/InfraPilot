import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { memberOf: any };

const UserGroups = ({ memberOf }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <CardHeader text={t("users.groups")} icon={faUserGroup} />
      <div className="flex flex-wrap">
        {memberOf && typeof memberOf !== "string" ? (
          memberOf.map((group: any) => (
            <div className="bg-[#2B9AE9] rounded-[10px] w-fit px-2 py-1 text-[#FFFFFF] my-1 mr-2">
              {group}
            </div>
          ))
        ) : (
          <div>{t("users.groups.empty")}</div>
        )}
      </div>
    </div>
  );
};

export default UserGroups;
