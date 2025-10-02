import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
};

const AddDashboardModal = ({ isModalOpen, onCloseModal }: Props) => {
  return (
    <Modal
      classNames={{ modal: "w-[500px]" }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <div className="text-[#3C3C3C] font-bold text-[32px]">Add Dashboard</div>
      <div className="py-4">
        <Input label="Name" />
      </div>
      <div className="float-right">
        <ButtonPrimary onClick={() => {}} text="Submit" />
      </div>
    </Modal>
  );
};

export default AddDashboardModal;
