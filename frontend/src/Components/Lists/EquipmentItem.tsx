import {
  faAppleAlt,
  faComputerMouse,
  faLaptop,
  faPen,
  faTrashAlt,
  faUserMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useNavigate, useParams } from "react-router";
import Badge from "../Badges/Badge";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import ButtonSecondary from "../Buttons/ButtonSecondary";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignDevice } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";
import { toast } from "react-toastify";

type Props = {
  id: number;
  serialNumber: string;
  subgroup: string;
  location: string;
  model: string;
  assetName: string;
};

const EquipmentItem = ({
  id,
  serialNumber,
  subgroup,
  location,
  model,
  assetName,
}: Props) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthInfo();
  const params = useParams();
  const navigate = useNavigate();
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
    mutationFn: async (values: any) =>
      assignDevice(accessToken, { deviceId: id, userId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDevice"] });
      toast.success("Device unassigned!");
      navigate(`/users/${params.id}`);
    },
  });

  return (
    <div className="flex justify-between">
      <Link to={`/devices/${id}/system`} className="py-1">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={getDeviceIcon(subgroup)}
            className="pr-2 text-[#535353]"
          />
          <span className="uppercase text-[#2B9AE9]">
            {assetName && `${assetName} - `}
          </span>
          <span className="text-[#535353]">{`${model}, ${serialNumber}`}</span>
          <Badge text={location} className="ml-2 bg-[#2B9AE9]" />
        </div>
      </Link>
      <ButtonSecondary icon={faUserMinus} onClick={mutation.mutate} />
    </div>
  );
};

export default EquipmentItem;
