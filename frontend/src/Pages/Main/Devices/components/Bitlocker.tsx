import { useTranslation } from "react-i18next";
import StatusPill from "../../../../Components/Badges/StatusPill";
import {
  faBan,
  faLock,
  faLockOpen,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { bitlocker: any };

const Bitlocker = ({ bitlocker }: Props) => {
  const { t } = useTranslation();
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
      <CardHeader text={t("device.section.bitlocker")} icon={faLock} />
      {(bitlocker ?? []).map((bl: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[#3C3C3C] font-semibold">{`Partition ${
            bl.MountPoint
          } (${Math.floor(bl.CapacityGB)} GB)`}</div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-1">
            {volumeTypeArray[bl.VolumeType]}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-1">
            <StatusPill
              icon={bl.LockStatus === 1 ? faLock : faLockOpen}
              tone={bl.LockStatus === 1 ? "green" : "red"}
              text={bl.LockStatus === 1 ? "Locked" : "Unlocked"}
            />
            <StatusPill
              icon={bl.ProtectionStatus === 1 ? faShield : faBan}
              tone={bl.ProtectionStatus === 1 ? "green" : "red"}
              text={bl.ProtectionStatus === 1 ? "Protected" : "Vulnerable"}
            />
            {(bl.KeyProtector ?? []).map((kp: any, kpIndex: number) => (
              <StatusPill key={kpIndex} tone="blue" text={kp} />
            ))}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter
              name="Volume Status"
              value={volumeEncryptingStatusArray[bl.VolumeStatus]}
            />
            <Parameter
              name="Encryption Method"
              value={encryptionMethodArray[bl.EncryptionMethod]}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Bitlocker;
