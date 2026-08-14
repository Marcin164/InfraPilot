import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faListCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import SlaRulesTable from "../../../../Components/Tables/SlaRulesTable";
import EditRuleModal from "../../../../Components/Modals/EditRuleModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { deleteSlaRule } from "../../../../Services/sla";

type Props = {
  slaRules: any;
};

const SlaRules = ({ slaRules }: Props) => {
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
    mutationFn: (id: string) => deleteSlaRule(id),
    onSuccess: () => {
      toast.success(t("toast.success.ruleDeleted"));
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.ruleDelete")),
  });

  if (!slaRules) return null;

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
        <CardHeader text={t("settings.rules")} icon={faListCheck} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.rule")}
          onClick={openAddDefinitionModal}
        />
      </div>
      <SlaRulesTable
        data={slaRules}
        onEdit={openEditDefinitionModal}
        onDelete={(row: any) =>
          askConfirm(
            () => deleteMutation.mutate(row.id),
            t("settings.sla.confirmDeleteRule"),
          )
        }
      />
      <EditRuleModal
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

export default SlaRules;
