import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faCloud } from "@fortawesome/free-solid-svg-icons";

type Props = {
  servers: any;
};

const DNS = ({ servers }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <CardHeader text={t("device.section.dns")} icon={faCloud} />
      <div>
        {servers.map((server: any) => (
          <div className="text-[#3C3C3C] font-semibold">{server}</div>
        ))}
      </div>
    </div>
  );
};

export default DNS;
