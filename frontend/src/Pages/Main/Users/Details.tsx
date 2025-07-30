import Equipment from "../../../Components/Details/Equipment";
import EquipmentHistory from "../../../Components/Details/EquipmentHistory";
import FormsList from "../../../Components/Details/FormsList";
import Groups from "../../../Components/Details/Groups";
import UserInfo from "../../../Components/Details/UserInfo";

type Props = {};

const Details = (props: Props) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      <div className="">
        <UserInfo />
        <Groups />
        <FormsList />
      </div>
      <Equipment />
      <EquipmentHistory />
    </div>
  );
};

export default Details;
