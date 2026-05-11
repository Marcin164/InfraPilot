import Modal from "./AnimatedModal";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDashboard } from "../../Services/dashboards";
import { useAuthInfo } from "@propelauth/react";
import { useState } from "react";


type AddDashboardModalProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  selectDashboard?: (dashboard: {
    id: string;
    name: string;
    userId: string;
  }) => void;
};

const AddDashboardModal: React.FC<AddDashboardModalProps> = ({
  isModalOpen,
  onCloseModal,
  selectDashboard,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthInfo();
  const [dashboardName, setDashboardName] = useState("");

  const mutation = useMutation({
    mutationFn: (body: { name: string; userId: string }) => {
      return createDashboard(body);
    },
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      if (selectDashboard) selectDashboard(newDashboard);
      handleOnClose();
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDashboardName(e.target.value);
  };

  const handleOnClose = () => {
    setDashboardName("");
    onCloseModal();
  };

  const handleCreateDashboard = () => {
    if (!dashboardName.trim()) return;
    if (!user?.userId) return;

    mutation.mutate({
      name: dashboardName.trim(),
      userId: user.userId,
    });
  };

  return (
    <Modal
      classNames={{ modal: "w-[500px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <div className="text-gray-800 font-bold text-2xl mb-4">{t("dashboard.add")}</div>
      <Input label={t("form.name")} value={dashboardName} onChange={handleInputChange} />
      <div className="flex justify-end mt-4">
        <ButtonPrimary text={t("common.create")} onClick={handleCreateDashboard} />
      </div>
    </Modal>
  );
};

export default AddDashboardModal;
