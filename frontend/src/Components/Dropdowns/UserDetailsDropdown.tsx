import React, { useState } from "react";
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

import type { User } from "../../Types";

type Props = { data: User };

const UserDetailsDropdown = ({ data }: Props) => {
  const queryClient = useQueryClient();
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
      navigate("/users");
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

  return (
    <Dropdown>
      <ButtonPrimary
        color="white"
        icon={faPen}
        text="Edit"
        className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
        onClick={toggleEditUserModalOpen}
      />
      <ButtonPrimary
        color="white"
        icon={faTrash}
        text="Delete"
        className="h-[34px] text-[16px] w-full my-1 text-left text-[#BC0E0E] shadow-none"
        onClick={toggleConfirmationModalOpen}
      />
      <ButtonPrimary
        color="white"
        icon={faComputer}
        text="Edit equipment"
        className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
        onClick={() => navigate(`/users/${id}/equipmentedit`)}
      />
      <ButtonPrimary
        color="white"
        icon={faFile}
        text="Add form"
        className="h-[34px] text-[16px] w-full my-1 text-left shadow-none"
        onClick={toggleAddFormModalOpen}
      />
      <ConfirmationModal
        isModalOpen={isConfirmationModalOpen}
        handleOnClose={toggleConfirmationModalOpen}
        onCancel={toggleConfirmationModalOpen}
        onDelete={mutation.mutate}
      />
      <AddUserModal
        isModalOpen={isEditUserModalOpen}
        onCloseModal={toggleEditUserModalOpen}
        data={data}
      />
      <AddFormModal
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
    </Dropdown>
  );
};

export default UserDetailsDropdown;
