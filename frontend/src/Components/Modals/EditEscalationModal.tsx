import React from "react";
import Modal from "./AnimatedModal";
import CardHeader from "../Headers/CardHeader";
import EditEscalationForm from "../Forms/EditEscalationForm";

type Props = {
  data?: any;
  isModalOpen: boolean;
  handleOnClose: () => void;
};

const EditEscalationModal = ({ data, isModalOpen, handleOnClose }: Props) => {
  return (
    <Modal
      classNames={{
        modal: "w-[500px] h-[600px] rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={data ? "Edit escalation" : "Add escalation"} />
      <EditEscalationForm data={data} />
    </Modal>
  );
};

export default EditEscalationModal;
