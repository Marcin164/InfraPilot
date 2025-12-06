import React from "react";
import Modal from "react-responsive-modal";
import CardHeader from "../Headers/CardHeader";
import ApplyChangeForm from "../Forms/ApplyChangeForm";

type Props = {
  isModalOpen: any;
  handleOnClose: any;
};

const ApplyChangesModal = ({ isModalOpen, handleOnClose }: Props) => {
  return (
    <Modal
      classNames={{
        modal: "w-[800px] rounded-[10px] max-h-[80vh] overflow-y-auto",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text="Apply change" />
      <ApplyChangeForm />
    </Modal>
  );
};

export default ApplyChangesModal;
