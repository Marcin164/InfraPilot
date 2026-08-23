import React from "react";
import Modal from "./AnimatedModal";
import CardHeader from "../Headers/CardHeader";
import EditDefinitionForm from "../Forms/EditDefinitionForm";

type Props = {
  data?: any;
  isModalOpen: boolean;
  handleOnClose: () => void;
  onCreated?: (definition: any) => void;
};

const EditDefinitionModal = ({ data, isModalOpen, handleOnClose, onCreated }: Props) => {
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
      <EditDefinitionForm
        data={data}
        onSaved={
          onCreated
            ? (definition) => {
                onCreated(definition);
                handleOnClose();
              }
            : undefined
        }
      />
    </Modal>
  );
};

export default EditDefinitionModal;
