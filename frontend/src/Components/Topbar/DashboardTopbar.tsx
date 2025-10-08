import { faPencil, faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useState } from "react";
import AddDashboardModal from "../Modals/AddDashboardModal";
import EditDashboardModal from "../Modals/EditDashboardModal";
import Select from "../Inputs/Select";

type Props = {
  selectOptions: Array<any>;
  selectDashboard: any;
  currentDashboard: any;
};

const DashboardTopbar = ({
  selectOptions,
  selectDashboard,
  currentDashboard,
}: Props) => {
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
        <Select
          options={selectOptions}
          onSelect={selectDashboard}
          value={
            currentDashboard
              ? { value: currentDashboard.id, label: currentDashboard.name }
              : selectOptions[0]
          }
        />
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
        selectDashboard={selectDashboard}
      />
      <EditDashboardModal
        isModalOpen={isOpenEditDashboardModal}
        onCloseModal={onOpenEditDashboardModal}
      />
    </div>
  );
};

export default DashboardTopbar;
