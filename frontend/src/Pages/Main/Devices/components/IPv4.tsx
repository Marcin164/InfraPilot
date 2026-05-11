import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = {
  IPv4Address: string;
  NetMask: string;
  IPv4Gateway: string;
};

const IPv4 = ({ IPv4Address, NetMask, IPv4Gateway }: Props) => {
  const { t } = useTranslation();
  return (
    <div>
      <CardHeader text={t("device.section.ipv4")} />
      <div>
        <span className="text-[#3C3C3C] font-light">Address: </span>
        <span className="text-[#3C3C3C] font-semibold">{`${IPv4Address} | ${NetMask}`}</span>
      </div>
      {IPv4Gateway && (
        <div>
          <span className="text-[#3C3C3C] font-light">Gateway: </span>
          <span className="text-[#3C3C3C] font-semibold">{IPv4Gateway}</span>
        </div>
      )}
    </div>
  );
};

export default IPv4;
