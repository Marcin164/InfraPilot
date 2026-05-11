import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SoftwareTable from "../../../../Components/Tables/SoftwareTable";
import { useOutletContext } from "react-router";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import AppxTable from "../../../../Components/Tables/AppxTable";
import FeaturesTable from "../../../../Components/Tables/FeaturesTable";
import NoData from "../components/NoData";

type Props = {};

const Software = (props: Props) => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const [softwareInfoType, setSoftwareInfoType] = useState(1);

  if (!device?.data?.software) return <NoData />;

  const softwareInfo = device.data.software;

  const toggleSoftwareInfo = (type: any) => {
    setSoftwareInfoType(type);
  };

  const setPanel = (type: any) => {
    let panel = <></>;

    switch (type) {
      case 1:
        panel = <SoftwareTable data={softwareInfo.installed_programs} />;
        break;

      case 2:
        panel = <AppxTable data={softwareInfo.appx_packages} />;
        break;

      case 3:
        panel = <FeaturesTable data={softwareInfo.windows_features} />;
        break;
    }

    return panel;
  };

  return (
    <div className="w-full ">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text={t("device.section.applications")}
          onClick={() => toggleSoftwareInfo(1)}
        />
        <ButtonPrimary text={t("device.section.appx")} onClick={() => toggleSoftwareInfo(2)} />
        <ButtonPrimary text={t("device.section.features")} onClick={() => toggleSoftwareInfo(3)} />
      </div>
      {setPanel(softwareInfoType)}
    </div>
  );
};

export default Software;
