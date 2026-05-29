import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { faComputer } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import EquipmentItem from "../../../../Components/Lists/EquipmentItem";

type Props = { devices: any };

const Equipment = ({ devices }: Props) => {
  const { t } = useTranslation();
  const { id } = useParams();

  if (!devices) return null;

  const mainDevices = devices.filter(
    (device: any) => device.userId === id && device.group === "Computers",
  );

  const peripherals = devices.filter(
    (device: any) => device.userId === id && device.group === "Peripherals",
  );

  const Section = ({ label, items }: { label: string; items: any[] }) => (
    <div className="mt-3">
      <div className="text-[11px] font-bold text-[#9a9a9a] uppercase tracking-widest mb-2">
        {label}
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-[#F5F5F5]">
          {items.map((device: any) => (
            <EquipmentItem key={device.id} {...device} />
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-[#9a9a9a]">{t("users.equipment.noDevices")}</div>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.equipment")} icon={faComputer} />
      <Section label={t("users.equipment.computersOwned")} items={mainDevices} />
      <Section label={t("users.equipment.peripherals")} items={peripherals} />
    </div>
  );
};

export default Equipment;
