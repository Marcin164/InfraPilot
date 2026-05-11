import { faHardDrive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { drives: any };

const ExternalDrives = ({ drives }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader icon={faHardDrive} text={t("device.section.externalDrives")} />
      {drives.map((drive: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {`${drive.DeviceID} ${drive.VolumeName}`}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {`(${drive.FileSystem})`}
          </div>
          <div className="h-[20px] bg-[#D9D9D9] rounded-[5px] overflow-hidden">
            <div
              className="h-[20px] bg-[#2B9AE9]"
              style={{ width: `${(drive.FreeSpace / drive.Size) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExternalDrives;
