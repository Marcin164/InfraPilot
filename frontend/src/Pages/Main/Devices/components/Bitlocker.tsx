import React from "react";
import Badge from "../../../../Components/Badges/Badge";
import {
  faBan,
  faLock,
  faLockOpen,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = { bitlocker: any };

const Bitlocker = ({ bitlocker }: Props) => {
  const volumeTypeArray = ["OS Volume", "Fixed Data", "Removable Data"];
  const volumeEncryptingStatusArray = [
    "Fully Decrypted",
    "Fully Encrypted",
    "Encrypting",
    "Decrypting",
  ];
  const encryptionMethodArray = [
    "None",
    "AES_128",
    "AES_256",
    "XTS-AES_128",
    "XTS-AES_256",
  ];

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">BitLocker</div>
      {bitlocker.map((bl: any) => (
        <div className="pb-2">
          <div className="text-[#3C3C3C] font-semibold">{`Partition ${
            bl.MountPoint
          } (${Math.floor(bl.CapacityGB)} GB)`}</div>
          <div className="text-[14px] font-light text-[#3C3C3C]">
            {volumeTypeArray[bl.VolumeType]}
          </div>
          <div className="flex flex-wrap">
            <Badge
              icon={bl.LockStatus === 1 ? faLock : faLockOpen}
              className={bl.LockStatus === 1 ? "bg-[#30A712]" : "bg-[#F3606A]"}
              text={bl.LockStatus === 1 ? "Locked" : "Unlocked"}
            />
            <Badge
              icon={bl.ProtectionStatus === 1 ? faShield : faBan}
              className={
                bl.ProtectionStatus === 1 ? "bg-[#30A712]" : "bg-[#F3606A]"
              }
              text={bl.ProtectionStatus === 1 ? "Protected" : "Vulnerable"}
            />
          </div>
          {bl.KeyProtector.map((kp: any) => (
            <div>{kp}</div>
          ))}
          <Parameter
            name="Volume Status"
            value={volumeEncryptingStatusArray[bl.VolumeStatus]}
          />
          <Parameter
            name="Encryption Method"
            value={encryptionMethodArray[bl.EncryptionMethod]}
          />
        </div>
      ))}
    </div>
  );
};

export default Bitlocker;
