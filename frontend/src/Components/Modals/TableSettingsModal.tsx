import Modal from "./AnimatedModal";
import CheckboxButton from "../Inputs/CheckboxButton";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserSettings } from "../../Services/settings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";

import type { UserSettings } from "../../Types";

type SettingsKey = keyof Pick<
  UserSettings,
  | "usersTableColumnOrder"
  | "ticketsTableColumnOrder"
  | "devicesTableColumnOrder"
  | "licensesTableColumnOrder"
  | "procurementTableColumnOrder"
>;

type Props = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  className?: string;
  settings: UserSettings;
  checkboxes: { name: string; label: string }[];
  settingsKey: SettingsKey;
};

const TableSettingsModal = ({
  isModalOpen,
  onCloseModal,
  className = "",
  settings,
  checkboxes,
  settingsKey,
}: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: string[]) => {
      return updateUserSettings({ [settingsKey]: values });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });

  const [chosenColumns, setChosenColumns] = useState<string[]>(
    settings?.[settingsKey] ?? [],
  );

  const persist = (next: string[]) => {
    setChosenColumns(next);
    mutation.mutate(next);
  };

  const handleToggleColumn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const updated = checked
      ? chosenColumns.includes(name) ? chosenColumns : [...chosenColumns, name]
      : chosenColumns.filter((col) => col !== name);
    persist(updated);
  };

  // drag state for reorder
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx.current === null || dragIdx.current === idx) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }
    const next = [...chosenColumns];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    dragIdx.current = null;
    setDragOverIdx(null);
    persist(next);
  };

  const labelMap = Object.fromEntries(
    checkboxes.map((c) => [c.name, c.label]),
  );

  return (
    <Modal
      classNames={{ modal: `${className} rounded-[10px]` }}
      open={isModalOpen}
      onClose={onCloseModal}
      center
    >
      <div className="max-h-[500px] overflow-y-auto">
        <div className="text-[#3C3C3C] text-[16px] font-bold py-2">
          {t("columns")}
        </div>
        <div className="flex flex-wrap gap-0">
          {checkboxes.map((checkbox) => (
            <CheckboxButton
              key={checkbox.name}
              label={checkbox.label}
              name={checkbox.name}
              onChange={handleToggleColumn}
              checked={chosenColumns.includes(checkbox.name)}
            />
          ))}
        </div>

        {chosenColumns.length > 0 && (
          <>
            <div className="text-[#3C3C3C] text-[16px] font-bold pt-4 pb-2">
              {t("table.columnOrder")}
            </div>
            <div className="flex flex-col gap-1">
              {chosenColumns.map((colId, idx) => (
                <div
                  key={colId}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => setDragOverIdx(null)}
                  className={`flex items-center gap-2 rounded-[8px] border bg-white px-3 py-2 text-[14px] font-medium text-[#3C3C3C] cursor-grab transition ${
                    dragOverIdx === idx
                      ? "border-[#2B9AE9] bg-[#E6F4FF]"
                      : "border-[#E0E0E0]"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faGripVertical}
                    className="text-[#8A8A8A] text-[12px]"
                  />
                  {labelMap[colId] ?? colId}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default TableSettingsModal;
