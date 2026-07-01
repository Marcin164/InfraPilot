import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faComputer, faFileWord } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import EquipmentItem from "../../../../Components/Lists/EquipmentItem";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { downloadUserHandoverForm } from "../../../../Services/devices";

type Props = { devices: any };

const Equipment = ({ devices }: Props) => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const handoverMutation = useMutation({
    mutationFn: () =>
      downloadUserHandoverForm(id!, i18n.language, `handover-${id}.docx`),
    onSuccess: () => {
      toast.success(t("users.equipment.handoverSuccess"));
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.message ?? t("users.equipment.handoverError"),
      ),
  });

  if (!devices) return null;

  const mainDevices = devices.filter(
    (device: any) => device.userId === id && device.group === "Computers",
  );

  const peripherals = devices.filter(
    (device: any) => device.userId === id && device.group === "Peripherals",
  );

  const hasEquipment = mainDevices.length + peripherals.length > 0;

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
      <div className="flex items-center justify-between gap-2">
        <CardHeader text={t("users.equipment")} icon={faComputer} />
        <ButtonPrimary
          icon={faFileWord}
          text={
            handoverMutation.isPending
              ? t("users.equipment.handoverGenerating")
              : t("users.equipment.handover")
          }
          onClick={() => handoverMutation.mutate()}
          disabled={handoverMutation.isPending || !hasEquipment}
          className="flex-shrink-0 text-[13px] px-3 py-1"
        />
      </div>
      <Section label={t("users.equipment.computersOwned")} items={mainDevices} />
      <Section label={t("users.equipment.peripherals")} items={peripherals} />
    </div>
  );
};

export default Equipment;
