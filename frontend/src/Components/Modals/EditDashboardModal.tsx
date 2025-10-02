import { Modal } from "react-responsive-modal";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
};

const EditDashboardModal = ({ isModalOpen, onCloseModal }: Props) => {
  return (
    <Modal
      classNames={{ modal: "w-[500px]" }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <div className="text-[#3C3C3C] font-bold text-[32px]">Edit Dashboard</div>
    </Modal>
  );
};

export default EditDashboardModal;
