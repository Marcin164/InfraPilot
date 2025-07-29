import { Modal } from "react-responsive-modal";

type Props = {
  openModal: any;
  onCloseModal: any;
};

const EditDashboardModal = ({ openModal, onCloseModal }: Props) => {
  return (
    <Modal
      classNames={{ modal: "w-[500px]" }}
      open={openModal}
      onClose={onCloseModal}
      center
    >
      <div className="text-[#3C3C3C] font-bold text-[32px]">Edit Dashboard</div>
    </Modal>
  );
};

export default EditDashboardModal;
