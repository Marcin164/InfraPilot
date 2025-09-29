import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";

type Props = {
  id: number;
  system: any;
  serialNumber: string;
  subgroup: string;
  model: string;
};

const EquipmentItem = ({
  id,
  system,
  serialNumber,
  subgroup,
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
    <Link to={`/devices/${id}/system`} className="py-1">
      <FontAwesomeIcon
        icon={getDeviceIcon(subgroup)}
        className="pr-2 text-[#535353]"
      />
      <span className="uppercase text-[#2B9AE9]">{system.hostname}</span>
      <span className="text-[#535353]">{`- ${model}, ${serialNumber}`}</span>
    </Link>
  );
};

export default EquipmentItem;
