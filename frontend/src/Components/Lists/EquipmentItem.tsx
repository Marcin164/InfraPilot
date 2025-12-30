import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
  faPen,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";
import Badge from "../Badges/Badge";

type Props = {
  id: number;
  serialNumber: string;
  subgroup: string;
  location: string;
  model: string;
  assetName: string;
};

const EquipmentItem = ({
  id,
  serialNumber,
  subgroup,
  location,
  model,
  assetName,
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
    <div className="flex justify-between">
      <Link to={`/devices/${id}/system`} className="py-1">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={getDeviceIcon(subgroup)}
            className="pr-2 text-[#535353]"
          />
          <span className="uppercase text-[#2B9AE9]">
            {assetName && `${assetName} - `}
          </span>
          <span className="text-[#535353]">{`${model}, ${serialNumber}`}</span>
          <Badge text={location} className="ml-2 bg-[#2B9AE9]" />
        </div>
      </Link>
    </div>
  );
};

export default EquipmentItem;
