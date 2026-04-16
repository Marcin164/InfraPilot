import { faPencil, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import AddDashboardModal from "../Modals/AddDashboardModal";
import EditDashboardModal from "../Modals/EditDashboardModal";
import Select from "../Inputs/Select";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {
  selectOptions: Array<any>;
  selectDashboard: any;
  currentDashboard: any;
  onWidgetDragStart?: (widgetId: string) => void;
};

const DashboardTopbar = ({
  selectOptions,
  selectDashboard,
  currentDashboard,
  onWidgetDragStart,
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
          onClick={onOpenEditDashboardModal}
          className="mr-2"
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
      <EditDashboardModal isModalOpen={isOpenEditDashboardModal} onWidgetDragStart={onWidgetDragStart} />
    </div>
  );
};

export default DashboardTopbar;
