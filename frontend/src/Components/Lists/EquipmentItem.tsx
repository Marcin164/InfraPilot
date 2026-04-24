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
      assignDevice({ deviceId: id, userId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDevice"] });
      toast.success("Device unassigned!");
      navigate(`/admin/users/${params.id}`);
    },
  });

  return (
    <div className="flex justify-between items-center">
      <Link to={`/admin/devices/${id}/system`} className="py-1">
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
      </Link>
      <ButtonPrimary icon={faUserMinus} color="red" onClick={mutation.mutate} />
    </div>
  );
};

export default EquipmentItem;
