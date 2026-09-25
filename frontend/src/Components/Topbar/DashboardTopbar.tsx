import { faPencil, faPlus, faTag, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AddDashboardModal from "../Modals/AddDashboardModal";
import EditDashboardModal from "../Modals/EditDashboardModal";
import RenameDashboardModal from "../Modals/RenameDashboardModal";
import Select from "../Inputs/Select";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { usePermissions } from "../../Hooks/usePermissions";
import { hasPermission } from "../../Constants/navigation";

type Props = {
  selectOptions: Array<any>;
  selectDashboard: any;
  currentDashboard: any;
  onWidgetDragStart?: (widgetId: string) => void;
  onDeleteDashboard?: () => void;
  onDashboardRenamed?: (dashboard: any) => void;
};

const DashboardTopbar = ({
  selectOptions,
  selectDashboard,
  currentDashboard,
  onWidgetDragStart,
  onDeleteDashboard,
  onDashboardRenamed,
}: Props) => {
  const { t } = useTranslation();
  const permissionsQuery = usePermissions();
  // create/delete/rename/widget-layout are all dashboards.edit on the
  // backend (see dashboards.controller.ts) -- viewing the dashboard list
  // itself stays open (dashboards.view currently gates nothing there).
  const canEdit = hasPermission("dashboards.edit", permissionsQuery.data);
  const [isOpenAddDashboardModal, setIsOpenAddDashboardModal] = useState(false);
  const [isOpenEditDashboardModal, setIsOpenEditDashboardModal] =
    useState(false);
  const [isOpenRenameDashboardModal, setIsOpenRenameDashboardModal] =
    useState(false);

  const onOpenAddDashboardModal = () =>
    setIsOpenAddDashboardModal((prev) => !prev);

  const onOpenEditDashboardModal = () =>
    setIsOpenEditDashboardModal((prev) => !prev);

  const onOpenRenameDashboardModal = () =>
    setIsOpenRenameDashboardModal((prev) => !prev);

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
      {canEdit && (
        <div className="flex">
          <ButtonPrimary
            icon={faTag}
            onClick={onOpenRenameDashboardModal}
            disabled={!currentDashboard}
            className="mr-2"
          />
          <ButtonPrimary
            icon={faPencil}
            onClick={onOpenEditDashboardModal}
            className="mr-2"
          />
          <ButtonPrimary
            icon={faTrash}
            onClick={onDeleteDashboard}
            disabled={selectOptions.length <= 1}
            color="red"
            className="mr-2"
          />
          <ButtonPrimary
            icon={faPlus}
            text={t("btn.add.dashboard")}
            onClick={onOpenAddDashboardModal}
          />
        </div>
      )}
      {canEdit && (
        <>
          <AddDashboardModal
            isModalOpen={isOpenAddDashboardModal}
            onCloseModal={onOpenAddDashboardModal}
            selectDashboard={selectDashboard}
          />
          <EditDashboardModal isModalOpen={isOpenEditDashboardModal} onWidgetDragStart={onWidgetDragStart} />
          <RenameDashboardModal
            isModalOpen={isOpenRenameDashboardModal}
            onCloseModal={onOpenRenameDashboardModal}
            currentDashboard={currentDashboard}
            onRenamed={onDashboardRenamed}
          />
        </>
      )}
    </div>
  );
};

export default DashboardTopbar;
