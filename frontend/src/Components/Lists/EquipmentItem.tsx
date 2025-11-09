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
  system: any;
  serialNumber: string;
  subgroup: string;
  location: string;
  model: string;
  editMode: boolean;
  onEditClick?: any;
};

const EquipmentItem = ({
  id,
  system,
  serialNumber,
  subgroup,
  location,
  model,
  editMode = false,
  onEditClick,
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
          <span className="uppercase text-[#2B9AE9]">{`${system.hostname} - `}</span>
          <span className="text-[#535353]">{`${model}, ${serialNumber}`}</span>
          <Badge text={location} className="ml-2 bg-[#2B9AE9]" />
        </div>
      </Link>
      {editMode && (
        <div>
          <FontAwesomeIcon
            className="text-[#3C3C3C] text-[20px] cursor-pointer mr-3"
            icon={faPen}
            onClick={() => onEditClick(id)}
          />
          <FontAwesomeIcon
            className="text-[#F3606E] text-[20px] cursor-pointer"
            icon={faTrashAlt}
          />
        </div>
      )}
    </div>
  );
};

export default EquipmentItem;
