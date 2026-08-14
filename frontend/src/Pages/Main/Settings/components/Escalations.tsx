import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faPlus, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import EscalationsList from "../../../../Components/Lists/EscalationsList";
import EditEscalationModal from "../../../../Components/Modals/EditEscalationModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { deleteSlaEscalation } from "../../../../Services/sla";

type Props = {
  escalations: any[];
};

const Escalations = ({ escalations }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] =
    useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any | null>(
    null,
  );
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    onConfirm: () => void;
    message?: string;
  }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) =>
    setConfirmState({ open: true, onConfirm, message });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSlaEscalation(id),
    onSuccess: () => {
      toast.success(t("toast.success.escalationDeleted"));
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.escalationDelete")),
  });

  const openAddDefinitionModal = () => {
    setSelectedDefinition(null);
    setIsEditDefinitionModalOpen(true);
  };

  const openEditDefinitionModal = (row: any) => {
    setSelectedDefinition(row);
    setIsEditDefinitionModalOpen(true);
  };

  const closeDefinitionModal = () => {
    setIsEditDefinitionModalOpen(false);
    setSelectedDefinition(null);
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text={t("settings.escalations")} icon={faTriangleExclamation} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.escalation")}
          onClick={openAddDefinitionModal}
        />
      </div>
      <EscalationsList
        data={escalations}
        onEdit={openEditDefinitionModal}
        onDelete={(row: any) =>
          askConfirm(
            () => deleteMutation.mutate(row.id),
            t("settings.sla.confirmDeleteEscalation"),
          )
        }
      />
      <EditEscalationModal
        data={selectedDefinition}
        isModalOpen={isEditDefinitionModalOpen}
        handleOnClose={closeDefinitionModal}
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

export default Escalations;
