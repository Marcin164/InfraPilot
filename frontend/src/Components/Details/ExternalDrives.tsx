import { faHardDrive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = { drives: any };

const ExternalDrives = ({ drives }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#3C3C3C]">
        <FontAwesomeIcon className="mr-2" icon={faHardDrive} />
        <span>External Drives</span>
      </div>
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
