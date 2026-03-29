import EquipmentItem from "../../../../Components/Lists/EquipmentItem";
import { useParams } from "react-router";

type Props = {
  devices: any;
};

const Equipment = ({ devices }: Props) => {
  const { id } = useParams();

  if (!devices) return null;

  const mainDevices = devices.filter(
    (device: any) => device.userId === id && device.group === "Computers",
  );

  const loggedDevice: any = null;

  const peripherals = devices.filter(
    (device: any) => device.userId === id && device.group === "Peripherals",
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
        {peripherals.length > 0 ? (
          peripherals.map((peripheral: any) => (
            <EquipmentItem {...peripheral} />
          ))
        ) : (
          <div>No devices</div>
        )}
      </div>
    </div>
  );
};

export default Equipment;
