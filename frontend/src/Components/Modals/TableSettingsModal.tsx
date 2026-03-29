import { Modal } from "react-responsive-modal";
import CheckboxButton from "../Inputs/CheckboxButton";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserSettings } from "../../Services/settings";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
  className: string;
  settings: any;
  checkboxes: any;
  settingsKey: any;
};

const TableSettingsModal = ({
  isModalOpen,
  onCloseModal,
  className = "",
  settings = [],
  checkboxes,
  settingsKey,
}: Props) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return updateUserSettings({ [settingsKey]: values });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      close();
    },
  });

  const [choosenColumns, setChoosenColumns] = useState(settings[settingsKey]);

  const handleToggleColumn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setChoosenColumns((prev: any) => {
      let updated: string[];

      if (checked) {
        updated = prev.includes(name) ? prev : [...prev, name];
      } else {
        updated = prev.filter((col: any) => col !== name);
      }

      mutation.mutate(updated);
      return updated;
    });
  };

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
          {checkboxes.map((checkbox: any) => (
            <CheckboxButton
              label={checkbox.label}
              name={checkbox.name}
              onChange={handleToggleColumn}
              checked={choosenColumns.includes(checkbox.name)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default TableSettingsModal;
