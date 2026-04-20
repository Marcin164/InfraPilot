import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Badge from "../../../../Components/Badges/Badge";

type DeviceLike = {
  id: string;
  serialNumber: string;
  subgroup: string;
  location: string;
  model: string;
  assetName: string;
  group?: string;
  userId?: string;
};

type Props = {
  devices: DeviceLike[];
  userId: string;
};

const getIcon = (subgroup: string) => {
  switch (subgroup) {
    case "Laptop":
      return faLaptop;
    case "Macbook":
      return faAppleAlt;
    default:
      return faComputerMouse;
  }
};

const DeviceLine = ({ device }: { device: DeviceLike }) => (
  <div className="py-1">
    <div className="flex items-center">
      <FontAwesomeIcon
        icon={getIcon(device.subgroup)}
        className="pr-2 text-[#535353]"
      />
      <span className="uppercase text-[#2B9AE9]">
        {device.assetName && `${device.assetName} - `}
      </span>
      <span className="text-[#535353]">
        {`${device.model}, ${device.serialNumber}`}
      </span>
      {device.location && (
        <Badge text={device.location} className="ml-2 bg-[#2B9AE9]" />
      )}
    </div>
  </div>
);

const AccountEquipment = ({ devices, userId }: Props) => {
  const mine = devices.filter((d) => d.userId === userId);
  const mainDevices = mine.filter((d) => d.group === "Computers");
  const peripherals = mine.filter((d) => d.group === "Peripherals");

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-xl">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">Equipment</div>

      <div className="py-2 font-bold">Computers</div>
      {mainDevices.length > 0 ? (
        mainDevices.map((d) => <DeviceLine key={d.id} device={d} />)
      ) : (
        <div className="text-[14px] text-[#8A8A8A]">No device</div>
      )}

      <div className="py-2 font-bold">Peripherals</div>
      {peripherals.length > 0 ? (
        peripherals.map((d) => <DeviceLine key={d.id} device={d} />)
      ) : (
        <div className="text-[14px] text-[#8A8A8A]">No device</div>
      )}
    </div>
  );
};

export default AccountEquipment;
