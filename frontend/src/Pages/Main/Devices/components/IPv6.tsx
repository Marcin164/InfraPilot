import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = {
  IPv6Address: string;
  IPv6Gateway: string;
  IPv6LinkLocal: string;
};

const IPv6 = ({ IPv6Address, IPv6Gateway, IPv6LinkLocal }: Props) => {
  const { t } = useTranslation();
  if (!IPv6Address) return null;
  return (
    <div>
      <CardHeader text={t("device.section.ipv6")} />
      <div>
        <span className="text-[#3C3C3C] font-light">Address: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv6Address}`}</span>
      </div>
      {IPv6Gateway && (
        <div>
          <span className="text-[#3C3C3C] font-light">Gateway: </span>
          <span className="text-[#3C3C3C] font-semibold">{IPv6Gateway}</span>
        </div>
      )}
      <div>
        <span className="text-[#3C3C3C] font-light">Link-Local: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv6LinkLocal}`}</span>
      </div>
    </div>
  );
};

export default IPv6;
