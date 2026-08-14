import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
  faUserMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useNavigate, useParams } from "react-router";
import Badge from "../Badges/Badge";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignDevice } from "../../Services/devices";
import { toast } from "react-toastify";

type Props = {
  id: string;
  serialNumber: string;
  subgroup: string;
  location: string;
  model: string;
  assetName: string;
  editMode?: boolean;
  onEditClick?: (id: string) => void;
};

const EquipmentItem = ({
  id,
  serialNumber,
  subgroup,
  location,
  model,
  assetName,
  editMode,
  onEditClick,
}: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useParams();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Laptop":
        return faLaptop;
      case "Macbook":
        return faAppleAlt;
      default:
        return faComputerMouse;
    }
  };

  const mutation = useMutation({
    mutationFn: async () => assignDevice({ deviceId: id, userId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDevice"] });
      toast.success(t("toast.success.deviceUnassigned"));
      navigate(`/admin/users/${params.id}`);
    },
  });

  const content = (
    <div className="flex items-center">
      <FontAwesomeIcon
        icon={getDeviceIcon(subgroup)}
        className="pr-2 text-[#535353]"
      />
      <div>
        <div className="uppercase text-[#2B9AE9]">{assetName}</div>
        <div className="text-[#535353] text-[12px] font-bold">{`${model}, ${serialNumber}`}</div>
      </div>
      <Badge text={location} className="ml-8 bg-[#2B9AE9]" />
    </div>
  );

  return (
    <div className="flex justify-between items-center gap-2">
      {editMode ? (
        <button
          type="button"
          className="py-1 text-left"
          onClick={() => onEditClick?.(id)}
        >
          {content}
        </button>
      ) : (
        <Link to={`/admin/devices/${id}/system`} className="py-1">
          {content}
        </Link>
      )}
      <ButtonPrimary
        icon={faUserMinus}
        color="red"
        className="w-[34px] h-[34px] px-0 py-0 justify-center shrink-0"
        onClick={() => setIsConfirmOpen(true)}
      />
      <ConfirmationModal
        isModalOpen={isConfirmOpen}
        handleOnClose={() => setIsConfirmOpen(false)}
        onCancel={() => setIsConfirmOpen(false)}
        onDelete={() => {
          mutation.mutate();
          setIsConfirmOpen(false);
        }}
        message={t("users.equipment.confirmUnassign", { asset: assetName })}
      />
    </div>
  );
};

export default EquipmentItem;
