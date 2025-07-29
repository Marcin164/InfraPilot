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
    <div className="h-[100px] flex justify-between items-center">
      <div className="w-[360px] text-[28px]">
        <FontAwesomeIcon icon={faAngleLeft} className="px-4" />
        <span>Main Dashboard</span>
        <FontAwesomeIcon icon={faAngleRight} className="px-4" />
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
        openModal={isOpenAddDashboardModal}
        onCloseModal={onOpenAddDashboardModal}
      />
      <EditDashboardModal
        openModal={isOpenEditDashboardModal}
        onCloseModal={onOpenEditDashboardModal}
      />
    </div>
  );
};

export default DashboardTopbar;
