import React from "react";
import Modal from "react-responsive-modal";
import CardHeader from "../Headers/CardHeader";
import EditRuleForm from "../Forms/EditRuleForm";

type Props = {
  data?: any;
  isModalOpen: boolean;
  handleOnClose: () => void;
};

const EditRuleModal = ({ data, isModalOpen, handleOnClose }: Props) => {
  console.log(data);
  return (
    <Modal
      classNames={{
        modal: "w-[500px] h-[600px] rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={data ? "Edit rule" : "Add rule"} />
      <EditRuleForm data={data} />
    </Modal>
  );
};

export default EditRuleModal;
