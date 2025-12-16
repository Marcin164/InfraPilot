import React from "react";
import Modal from "react-responsive-modal";
import AddEquipmentForm from "../Forms/AddEquipmentForm";
import CardHeader from "../Headers/CardHeader";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
  selectDashboard?: any;
};

const AddDeviceModal = ({ isModalOpen, onCloseModal }: Props) => {
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
      <CardHeader text="Add device" />
      <AddEquipmentForm />
    </Modal>
  );
};

export default AddDeviceModal;
