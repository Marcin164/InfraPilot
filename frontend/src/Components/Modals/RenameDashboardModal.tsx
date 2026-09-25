import Modal from "./AnimatedModal";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameDashboard } from "../../Services/dashboards";
import { useEffect, useState } from "react";
import type { Dashboard } from "../../Types";

type RenameDashboardModalProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  currentDashboard: Dashboard | null;
  onRenamed?: (dashboard: Dashboard) => void;
};

const RenameDashboardModal: React.FC<RenameDashboardModalProps> = ({
  isModalOpen,
  onCloseModal,
  currentDashboard,
  onRenamed,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dashboardName, setDashboardName] = useState("");

  useEffect(() => {
    if (isModalOpen) setDashboardName(currentDashboard?.name ?? "");
  }, [isModalOpen, currentDashboard]);

  const mutation = useMutation({
    mutationFn: (name: string) => renameDashboard(currentDashboard!.id, name),
    onSuccess: (updatedDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      onRenamed?.(updatedDashboard);
      onCloseModal();
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDashboardName(e.target.value);
  };

  const handleRenameDashboard = () => {
    const trimmed = dashboardName.trim();
    if (!trimmed || !currentDashboard) return;
    mutation.mutate(trimmed);
  };

  return (
    <Modal
      classNames={{ modal: "w-[500px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <div className="text-gray-800 font-bold text-2xl mb-4">{t("dashboard.rename")}</div>
      <Input label={t("form.name")} value={dashboardName} onChange={handleInputChange} />
      <div className="flex justify-end mt-4">
        <ButtonPrimary
          text={t("common.save")}
          onClick={handleRenameDashboard}
          disabled={!dashboardName.trim() || mutation.isPending}
        />
      </div>
    </Modal>
  );
};

export default RenameDashboardModal;
