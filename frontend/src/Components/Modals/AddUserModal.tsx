import React, { useState } from "react";
import Modal from "react-responsive-modal";
import CardHeader from "../Headers/CardHeader";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import AddUserForm from "../Forms/AddUserForm";
import FileUpload from "../Inputs/FileUpload";
import { useTranslation } from "react-i18next";

type Props = { isModalOpen: any; onCloseModal: any; data?: any };

const AddUserModal = ({ isModalOpen, onCloseModal, data }: Props) => {
  const { t } = useTranslation();
  const [addUserMode, setAddUserMode] = useState(0);

  const toggleAddUserMode = (mode: number) => {
    setAddUserMode(mode);
  };
  return (
    <Modal
      classNames={{
        modal: "w-[800px] rounded-[10px] h-[80vh] max-h-[80vh] overflow-y-auto",
      }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <CardHeader text={t("btn.add.user")} />
      {!data && (
        <div className="pt-2 pb-4">
          <ButtonPrimary
            text={t("btn.add.user.manual")}
            className="mr-2"
            onClick={() => toggleAddUserMode(0)}
          />
          <ButtonPrimary
            text={t("btn.add.user.file")}
            onClick={() => toggleAddUserMode(1)}
          />
        </div>
      )}
      <div className="w-full">
        {addUserMode === 0 && <AddUserForm close={onCloseModal} data={data} />}
        {addUserMode === 1 && <FileUpload close={onCloseModal} />}
      </div>
    </Modal>
  );
};

export default AddUserModal;
