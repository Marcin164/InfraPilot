import React from "react";
import Modal from "react-responsive-modal";
import CardHeader from "../Headers/CardHeader";
import EditDefinitionForm from "../Forms/EditDefinitionForm";

type Props = {
  data?: any;
  isModalOpen: boolean;
  handleOnClose: () => void;
};

const EditDefinitionModal = ({ data, isModalOpen, handleOnClose }: Props) => {
  return (
    <Modal
      classNames={{
        modal: "w-[500px] h-[600px] rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={data ? "Edit definition" : "Add definition"} />
      <EditDefinitionForm data={data} />
    </Modal>
  );
};

export default EditDefinitionModal;
