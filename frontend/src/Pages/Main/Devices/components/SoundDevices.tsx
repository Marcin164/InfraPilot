import { faHeadphones } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { soundDevices: any };

const SoundDevices = ({ soundDevices }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.soundDevices")} icon={faHeadphones} />
      {soundDevices.map((soundDevice: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {soundDevice.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {soundDevice.manufacturer || "Manufacturer not available"}
          </div>
          <Parameter name="Device ID" value={soundDevice.pnp_device_id} />
          <Parameter name="Operational status" value={soundDevice.status} />
        </div>
      ))}
    </div>
  );
};

export default SoundDevices;
