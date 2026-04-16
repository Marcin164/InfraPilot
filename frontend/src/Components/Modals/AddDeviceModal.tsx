import React from "react";
import Modal from "react-responsive-modal";
import AddEquipmentForm from "../Forms/AddEquipmentForm";
import CardHeader from "../Headers/CardHeader";
import { useTranslation } from "react-i18next";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
  selectDashboard?: any;
};

const AddDeviceModal = ({ isModalOpen, onCloseModal }: Props) => {
  const { t } = useTranslation();
  const handleOnClose = () => {
    onCloseModal(false);
  };

  return (
    <Modal
      classNames={{ modal: "w-[500px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={t("btn.add.device")} />
      <AddEquipmentForm />
    </Modal>
  );
};

export default AddDeviceModal;
