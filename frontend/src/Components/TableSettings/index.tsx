import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import TableSettingsModal from "../Modals/TableSettingsModal";

type Props = {
  settings: any;
  checkboxes: any;
  settingsKey: any;
};

const Index = ({ settings, checkboxes, settingsKey }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  return (
    <div>
      <button
        onClick={toggleModal}
        className="w-[34px] h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]"
      >
        <FontAwesomeIcon icon={faGear} />
      </button>
      {isModalOpen && (
        <TableSettingsModal
          className="w-[700px]"
          isModalOpen={isModalOpen}
          onCloseModal={toggleModal}
          settings={settings}
          checkboxes={checkboxes}
          settingsKey={settingsKey}
        />
      )}
    </div>
  );
};

export default Index;
