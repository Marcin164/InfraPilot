import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import AccountSettings from "./AccountSettings";

type Props = {};

const AccountButton = (props: Props) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const toggleAccountModal = () => {
    setIsAccountModalOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleAccountModal}
        className="w-[34px] h-[34px] bg-[#2B9AE9] rounded-full flex justify-center items-center text-[#FFFFFF] cursor-pointer"
      >
        <FontAwesomeIcon icon={faUser} />
      </button>
      <AccountSettings
        isOpen={isAccountModalOpen}
        closeModal={toggleAccountModal}
      />
    </div>
  );
};

export default AccountButton;
