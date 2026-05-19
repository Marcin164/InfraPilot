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
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <div className="text-[24px] sm:text-[28px] font-semibold text-[#3C3C3C] mb-2">
        {t("users.equipment")}
      </div>
      <div className="overflow-y-auto max-h-[480px]">
        <div className="py-1 font-bold text-[14px] text-[#535353] uppercase tracking-wide">
          {t("users.equipment.computersOwned")}
        </div>
        {mainDevices?.length > 0 ? (
          mainDevices.map((device: any) => (
            <EquipmentItem key={device.id} {...device} />
          ))
        ) : (
          <div className="text-[#8A8A8A] text-[13px] py-1">
            {t("users.equipment.noDevice")}
          </div>
        )}

        <div className="py-1 mt-3 font-bold text-[14px] text-[#535353] uppercase tracking-wide">
          {t("users.equipment.computersSignedIn")}
        </div>
        {loggedDevice ? (
          <EquipmentItem {...loggedDevice} />
        ) : (
          <div className="text-[#8A8A8A] text-[13px] py-1">
            {t("users.equipment.noDevices")}
          </div>
        )}

        <div className="py-1 mt-3 font-bold text-[14px] text-[#535353] uppercase tracking-wide">
          {t("users.equipment.peripherals")}
        </div>
        {peripherals.length > 0 ? (
          peripherals.map((peripheral: any) => (
            <EquipmentItem key={peripheral.id} {...peripheral} />
          ))
        ) : (
          <div className="text-[#8A8A8A] text-[13px] py-1">
            {t("users.equipment.noDevices")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment;
