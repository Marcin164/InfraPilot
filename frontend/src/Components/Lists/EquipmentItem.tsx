import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";

type Props = {
  iddevices: string;
  scanInfo: string;
  serialNumber: string;
  type: string;
  model: string;
};

const EquipmentItem = ({
  iddevices,
  scanInfo,
  serialNumber,
  type,
  model,
}: Props) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Laptop":
        return faLaptop;
      case "Macbook":
        return faAppleAlt;
      default:
        return faComputerMouse;
    }
  };

  return (
    <Link to={`/devices/${iddevices}`} className="py-1">
      <FontAwesomeIcon
        icon={getDeviceIcon(type)}
        className="pr-2 text-[#535353]"
      />
      <span className="uppercase text-[#2B9AE9]">
        {JSON.parse(scanInfo).system_info.hostname}
      </span>
      <span className="text-[#535353]">{`- ${model}, ${serialNumber}`}</span>
    </Link>
  );
};

export default EquipmentItem;
