import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDashboard } from "../../Services/dashboards";
import { useAuthInfo } from "@propelauth/react";
import { useState } from "react";

type Props = {
  isModalOpen: any;
  onCloseModal: any;
  selectDashboard?: any;
};

const AddDashboardModal = ({
  isModalOpen,
  onCloseModal,
  selectDashboard,
}: Props) => {
  const queryClient = useQueryClient();
  const [dashboardName, setDashboardName] = useState("");
  const authInfo = useAuthInfo();
  const mutation = useMutation({
    mutationFn: (body: any) => createDashboard(authInfo.accessToken, body),
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      if (selectDashboard) selectDashboard(newDashboard);
      onCloseModal();
    },
  });

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    setDashboardName(value);
  };

  const handleOnClose = () => {
    setDashboardName("");
    onCloseModal();
  };

  return (
    <Modal
      classNames={{ modal: "w-[500px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <div className="text-[#3C3C3C] font-bold text-[32px]">Add Dashboard</div>
      <Input label="Name" onChange={handleInputChange} />
      <div className="float-right">
        <ButtonPrimary
          text="Create"
          onClick={() => {
            if (dashboardName.length > 0) {
              mutation.mutate({
                name: dashboardName,
                ownerId: authInfo.user?.userId,
              });
            }
          }}
        />
      </div>
    </Modal>
  );
};

export default AddDashboardModal;
