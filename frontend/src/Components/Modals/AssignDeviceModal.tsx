import React from "react";
import Modal from "react-responsive-modal";
import CardHeader from "../Headers/CardHeader";
import AssignDeviceForm from "../Forms/AssignDeviceForm";

type Props = {
  isModalOpen: any;
  handleOnClose: any;
};

const AssignDeviceModal = ({ isModalOpen, handleOnClose }: Props) => {
  return (
    <Modal
      classNames={{
        modal: "w-[500px] rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text="Assign User" />
      <AssignDeviceForm close={handleOnClose} />
    </Modal>
  );
};

export default AssignDeviceModal;
