import {
  faAngleLeft,
  faAngleRight,
  faPencil,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useState } from "react";
import AddDashboardModal from "../Modals/AddDashboardModal";
import EditDashboardModal from "../Modals/EditDashboardModal";

const DashboardTopbar = () => {
  const [isOpenAddDashboardModal, setIsOpenAddDashboardModal] = useState(false);
  const [isOpenEditDashboardModal, setIsOpenEditDashboardModal] =
    useState(false);

  const onOpenAddDashboardModal = () =>
    setIsOpenAddDashboardModal((prev) => !prev);

  const onOpenEditDashboardModal = () =>
    setIsOpenEditDashboardModal((prev) => !prev);

  return (
    <div className="py-2 flex justify-between items-center">
      <div className="w-[360px] text-[28px]">
        <button className="w-[34px] h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]">
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <span className="h-[34px] px-2 shadow-xl bg-[#FFFFFF] text-[20px] text-[#3C3C3C] mx-2">
          Main dashboard
        </span>
        <button className="w-[34px] h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]">
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>
      <div className="flex">
        <ButtonPrimary
          icon={faPencil}
          text="Edit Dashboard"
          onClick={onOpenEditDashboardModal}
        />
        <ButtonPrimary
          icon={faPlus}
          text="Add Dashboard"
          onClick={onOpenAddDashboardModal}
        />
      </div>
      <AddDashboardModal
        isModalOpen={isOpenAddDashboardModal}
        onCloseModal={onOpenAddDashboardModal}
      />
      <EditDashboardModal
        isModalOpen={isOpenEditDashboardModal}
        onCloseModal={onOpenEditDashboardModal}
      />
    </div>
  );
};

export default DashboardTopbar;
