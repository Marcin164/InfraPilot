import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import SLaDefinitionsTable from "../../../../Components/Tables/SLaDefinitionsTable";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faPlus, faStopwatch } from "@fortawesome/free-solid-svg-icons";
import EditDefinitionModal from "../../../../Components/Modals/EditDefinitionModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { deleteSlaDefinition } from "../../../../Services/sla";

type Props = {
  slaDefinitions: any;
};

const SlaDefinitions = ({ slaDefinitions }: Props) => {
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
    mutationFn: (id: string) => deleteSlaDefinition(id),
    onSuccess: () => {
      toast.success(t("toast.success.definitionDeleted"));
      queryClient.invalidateQueries({ queryKey: ["definitions"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.definitionDelete")),
  });

  if (!slaDefinitions) return null;

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
        <CardHeader text={t("settings.definitions")} icon={faStopwatch} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.definition")}
          onClick={openAddDefinitionModal}
        />
      </div>
      <SLaDefinitionsTable
        data={slaDefinitions}
        onEdit={openEditDefinitionModal}
        onDelete={(row: any) =>
          askConfirm(
            () => deleteMutation.mutate(row.id),
            t("settings.sla.confirmDeleteDefinition", { name: row.name }),
          )
        }
      />
      <EditDefinitionModal
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

export default SlaDefinitions;
