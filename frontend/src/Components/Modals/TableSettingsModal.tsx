import { Modal } from "react-responsive-modal";
import CheckboxButton from "../Inputs/CheckboxButton";
import Input from "../Inputs/Input";
import ColorPicker from "../Inputs/ColorPicker";

type Props = { isModalOpen: any; onCloseModal: any; className: string };

const TableSettingsModal = ({
  isModalOpen,
  onCloseModal,
  className = "",
}: Props) => {
  return (
    <Modal
      classNames={{ modal: `${className} rounded-[10px]` }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <div className="h-[500px]">
        <div>
          <div className="text-[#3C3C3C] text-[16px] font-bold py-2 capitalize">
            Columns
          </div>
          <CheckboxButton label="Name" checked={false} onChange={() => {}} />
          <CheckboxButton
            label="Username"
            checked={false}
            onChange={() => {}}
          />
          <CheckboxButton
            label="Current device"
            checked={false}
            onChange={() => {}}
          />
          <CheckboxButton
            label="Last logon"
            checked={false}
            onChange={() => {}}
          />
          <CheckboxButton
            label="Department"
            checked={false}
            onChange={() => {}}
          />
          <CheckboxButton label="Office" checked={false} onChange={() => {}} />
          <CheckboxButton
            label="Street address"
            checked={false}
            onChange={() => {}}
          />
          <CheckboxButton label="Country" checked={false} onChange={() => {}} />
        </div>
      </div>
    </Modal>
  );
};

export default TableSettingsModal;
