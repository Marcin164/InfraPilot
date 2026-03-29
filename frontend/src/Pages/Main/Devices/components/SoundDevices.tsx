import { faHeadphones } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = { soundDevices: any };

const SoundDevices = ({ soundDevices }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#3C3C3C]">
        <FontAwesomeIcon className="mr-2" icon={faHeadphones} />
        <span>Audio devices</span>
      </div>
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
