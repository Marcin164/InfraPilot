import { useState } from "react";
import Modal from "./AnimatedModal";
import AddEquipmentForm from "../Forms/AddEquipmentForm";
import CardHeader from "../Headers/CardHeader";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import FileUploadDevices from "../Inputs/FileUploadDevices";
import { useTranslation } from "react-i18next";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
};

const AddDeviceModal = ({ isModalOpen, onCloseModal }: Props) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState(0);

  const handleOnClose = () => {
    setMode(0);
    onCloseModal(false);
  };

  return (
    <Modal
      classNames={{
        modal: "w-[800px] rounded-[10px] h-[80vh] max-h-[80vh] overflow-y-auto",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={t("btn.add.device")} />
      <div className="pt-2 pb-4">
        <ButtonPrimary
          text={t("btn.add.device.manual")}
          className="mr-2"
          onClick={() => setMode(0)}
        />
        <ButtonPrimary
          text={t("btn.add.device.file")}
          onClick={() => setMode(1)}
        />
      </div>
      <div className="w-full">
        {mode === 0 && <AddEquipmentForm />}
        {mode === 1 && <FileUploadDevices close={handleOnClose} />}
      </div>
    </Modal>
  );
};

export default AddDeviceModal;
