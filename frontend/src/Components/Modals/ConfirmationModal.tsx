import { faTrash, faWarning, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Modal from "react-responsive-modal";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {
  isModalOpen: any;
  handleOnClose: any;
  onCancel: any;
  onDelete: any;
  message?: string;
};

const ConfirmationModal = ({
  isModalOpen,
  handleOnClose,
  onCancel,
  onDelete,
  message,
}: Props) => {
  return (
    <Modal
      classNames={{
        modal: "w-[500px] h-fit rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <div className="text-center font-bold text-[24px]">Dangerous action!</div>
      <div className="text-center py-6">
        <FontAwesomeIcon
          icon={faWarning}
          className="bg-[#FEFEFE] text-[#535353] text-[80px]"
        />
      </div>
      <div className="pb-4 font-light text-[20px] text-justify">
        {message || "Are you sure you want to delete this item? This action is irreversible."}
      </div>
      <div className="flex justify-around">
        <ButtonPrimary icon={faXmark} text="Cancel" onClick={onCancel} />
        <ButtonPrimary
          icon={faTrash}
          text="Delete"
          className="bg-[#F3606E]"
          onClick={onDelete}
        />
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
