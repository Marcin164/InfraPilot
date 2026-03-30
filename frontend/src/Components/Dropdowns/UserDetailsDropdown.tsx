import React, { useState } from "react";
import Dropdown from "./Components/Dropdown";
import ButtonSecondary from "../Buttons/ButtonSecondary";
import { faComputer, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../../Services/users";
import { toast } from "react-toastify";
import AddUserModal from "../Modals/AddUserModal";

import type { User } from "../../Types";

type Props = { data: User };

const UserDetailsDropdown = ({ data }: Props) => {
  const queryClient = useQueryClient();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
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

  return (
    <Dropdown>
      <ButtonSecondary
        icon={faPen}
        text="Edit"
        className="h-[34px] w-full text-left shadow-none"
        onClick={toggleEditUserModalOpen}
      />
      <ButtonSecondary
        icon={faTrash}
        text="Delete"
        className="h-[34px] w-full text-left text-[#BC0E0E] shadow-none"
        onClick={toggleConfirmationModalOpen}
      />
      <ButtonSecondary
        icon={faComputer}
        text="Edit equipment"
        className="h-[34px] w-full text-left shadow-none"
        onClick={() => navigate(`/users/${id}/equipmentedit`)}
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
    </Dropdown>
  );
};

export default UserDetailsDropdown;
