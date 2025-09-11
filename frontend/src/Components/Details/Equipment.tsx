import { faLaptop, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import EquipmentItem from "../Lists/EquipmentItem";
import PeripheralItem from "../Lists/PeripheralItem";

type Props = {
  devices: any;
  userId: string;
};

const Equipment = ({ devices, userId }: Props) => {
  if (!devices) return null;

  const mainDevices = devices.filter(
    (device: any) => device.owner === userId && device.type === "Macbook"
  );

  const loggedDevice: any = null;

  const peripherals = devices.filter(
    (device: any) =>
      device.owner === userId &&
      (device.type === "Mouse" || device.type === "Screen")
  );

  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">Equipment</div>
      <div className="h-[calc(100%-100px)]">
        <div className="py-2 font-bold">Computers owned by user</div>
        {mainDevices?.length > 0 ? (
          mainDevices.map((device: any) => <EquipmentItem {...device} />)
        ) : (
          <div>No device</div>
        )}
        <div className="py-2 font-bold">Computers with user signed in</div>
        {loggedDevice ? (
          <EquipmentItem {...loggedDevice} />
        ) : (
          <div>No devices</div>
        )}
        <div className="py-2 font-bold">Peripherals</div>

        {peripherals.map((peripheral: any) => (
          <PeripheralItem {...peripheral} />
        ))}
      </div>
      <div>
        <ButtonPrimary icon={faPen} text="Edit equipment" onClick={() => {}} />
      </div>
    </div>
  );
};

export default Equipment;
