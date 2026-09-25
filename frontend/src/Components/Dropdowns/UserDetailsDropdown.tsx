import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "./Components/Dropdown";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import {
  faComputer,
  faFile,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../../Services/users";
import { toast } from "react-toastify";
import AddUserModal from "../Modals/AddUserModal";
import AddFormModal from "../Modals/AddFormModal";
import { addForm } from "../../Services/forms";
import { usePermissions } from "../../Hooks/usePermissions";
import { hasPermission } from "../../Constants/navigation";

import type { User } from "../../Types";

type Props = { data: User };

const UserDetailsDropdown = ({ data }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissionsQuery = usePermissions();
  const canEdit = hasPermission("users.edit", permissionsQuery.data);
  const canDelete = hasPermission("users.delete", permissionsQuery.data);
  const canManageEquipment = hasPermission(
    "users.equipment.manage",
    permissionsQuery.data,
  );
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const mutation = useMutation({
    mutationFn: () => deleteUser(id!),
    onSuccess: () => {
      toast.success("User has been deleted!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("users");
    },
  });

  const toggleConfirmationModalOpen = () => {
    setIsConfirmationModalOpen((prev) => !prev);
  };

  const toggleEditUserModalOpen = () => {
    setIsEditUserModalOpen((prev) => !prev);
  };

  const toggleAddFormModalOpen = () => {
    setIsAddFormModalOpen((prev) => !prev);
  };

  if (!canEdit && !canDelete && !canManageEquipment) return null;

  return (
    <Dropdown data-cy="user-details-dropdown">
      {canEdit && (
        <ButtonPrimary
          data-cy="edit-user-btn"
          color="white"
          icon={faPen}
          text={t("common.edit")}
          className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
          onClick={toggleEditUserModalOpen}
        />
      )}
      {canDelete && (
        <ButtonPrimary
          data-cy="delete-user-btn"
          color="white"
          icon={faTrash}
          text={t("common.delete")}
          className="h-[34px] text-[16px] w-full my-1 text-left text-[#BC0E0E] shadow-none"
          onClick={toggleConfirmationModalOpen}
        />
      )}
      {canManageEquipment && (
        <ButtonPrimary
          data-cy="edit-equipment-btn"
          color="white"
          icon={faComputer}
          text={t("users.actions.editEquipment")}
          className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
          onClick={() => navigate(`/admin/users/${id}/equipmentedit`)}
        />
      )}
      {canManageEquipment && (
        <ButtonPrimary
          data-cy="add-form-btn"
          color="white"
          icon={faFile}
          text={t("users.actions.addForm")}
          className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
          onClick={toggleAddFormModalOpen}
        />
      )}
      {canDelete && (
        <ConfirmationModal
          data-cy="confirmation-modal"
          isModalOpen={isConfirmationModalOpen}
          handleOnClose={toggleConfirmationModalOpen}
          onCancel={toggleConfirmationModalOpen}
          onDelete={mutation.mutate}
        />
      )}
      {canEdit && (
        <AddUserModal
          data-cy="edit-user-modal"
          isModalOpen={isEditUserModalOpen}
          onCloseModal={toggleEditUserModalOpen}
          data={data}
        />
      )}
      {canManageEquipment && (
        <AddFormModal
          data-cy="add-form-modal"
          isModalOpen={isAddFormModalOpen}
          onCloseModal={toggleAddFormModalOpen}
          onSubmit={async (file) => {
            if (!id) return;
            try {
              await addForm(file, id);
              toast.success("Formularz został dodany!");
              queryClient.invalidateQueries({ queryKey: ["forms", id] });
            } catch {
              toast.error("Nie udało się dodać formularza");
            }
          }}
        />
      )}
    </Dropdown>
  );
};

export default UserDetailsDropdown;
