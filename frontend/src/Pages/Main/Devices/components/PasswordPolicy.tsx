import React from "react";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faKey } from "@fortawesome/free-solid-svg-icons";

type Props = { passwordPolicy: any };

const PasswordPolicy = ({ passwordPolicy }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.passwordPolicy")} icon={faKey} />
      <div className="mt-2 divide-y divide-[#F0F0F0]">
        {Object.entries(passwordPolicy ?? {}).map(([key, value]: any) => (
          <Parameter key={key} name={key} value={value} />
        ))}
      </div>
    </div>
  );
};

export default PasswordPolicy;
