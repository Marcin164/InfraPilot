import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import CalendarsTable from "../../../../Components/Tables/CalendarsTable";
import EditCalendarModal from "../../../../Components/Modals/EditCalendarModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { useState } from "react";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faCalendarDays, faPlus } from "@fortawesome/free-solid-svg-icons";
import { deleteCalendar } from "../../../../Services/sla";

type Props = {
  slaCalendars: any;
};

const SlaCalendar = ({ slaCalendars }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditCalendarModalOpen, setIsEditCalendarModalOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    onConfirm: () => void;
    message?: string;
  }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) =>
    setConfirmState({ open: true, onConfirm, message });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalendar(id),
    onSuccess: () => {
      toast.success(t("toast.success.calendarDeleted"));
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.calendarDelete")),
  });

  if (!slaCalendars) return null;

  const openAddCalendarModal = () => {
    setSelectedCalendar(null);
    setIsEditCalendarModalOpen(true);
  };

  const openEditCalendarModal = (row: any) => {
    setSelectedCalendar(row);
    setIsEditCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsEditCalendarModalOpen(false);
    setSelectedCalendar(null);
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text={t("settings.calendars")} icon={faCalendarDays} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.calendar")}
          onClick={openAddCalendarModal}
          className="max-[320px]:[&>span]:hidden"
        />
      </div>
      <CalendarsTable
        data={slaCalendars}
        onEdit={openEditCalendarModal}
        onDelete={(row: any) =>
          askConfirm(
            () => deleteMutation.mutate(row.id),
            t("settings.sla.confirmDeleteCalendar", { name: row.name }),
          )
        }
      />
      <EditCalendarModal
        data={selectedCalendar}
        isModalOpen={isEditCalendarModalOpen}
        handleOnClose={closeCalendarModal}
      />
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => {
          confirmState.onConfirm();
          setConfirmState((s) => ({ ...s, open: false }));
        }}
        message={confirmState.message}
      />
    </div>
  );
};

export default SlaCalendar;
