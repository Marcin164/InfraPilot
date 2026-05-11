import { useTranslation } from "react-i18next";
import EquipmentItem from "../../../../Components/Lists/EquipmentItem";
import { useParams } from "react-router";

type Props = {
  devices: any;
};

const Equipment = ({ devices }: Props) => {
  const { t } = useTranslation();
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
      <div className="text-[30px] font-semibold text-[#3C3C3C]">{t("users.equipment")}</div>
      <div className="h-[calc(100%-100px)]">
        <div className="py-2 font-bold">{t("users.equipment.computersOwned")}</div>
        {mainDevices?.length > 0 ? (
          mainDevices.map((device: any) => <EquipmentItem {...device} />)
        ) : (
          <div>{t("users.equipment.noDevice")}</div>
        )}
        <div className="py-2 font-bold">{t("users.equipment.computersSignedIn")}</div>
        {loggedDevice ? (
          <EquipmentItem {...loggedDevice} />
        ) : (
          <div>{t("users.equipment.noDevices")}</div>
        )}
        <div className="py-2 font-bold">{t("users.equipment.peripherals")}</div>
        {peripherals.length > 0 ? (
          peripherals.map((peripheral: any) => (
            <EquipmentItem {...peripheral} />
          ))
        ) : (
          <div>{t("users.equipment.noDevices")}</div>
        )}
      </div>
    </div>
  );
};

export default Equipment;
