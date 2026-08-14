import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import HeadlessTable from "./HeadlessTable";

type Props = {
  data: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
};

const SLaDefinitionsTable = ({ data, onEdit, onDelete }: Props) => {
  const columns = [
    {
      name: "Name",
      selector: (row: any) => row.name,
    },
    {
      name: "Target",
      selector: (row: any) => row.target || "All",
      width: "80px",
    },
    {
      name: "Time",
      selector: (row: any) => row.targetMinutes,
      width: "80px",
    },
    {
      name: "Calendar",
      selector: (row: any) => row.calendar?.name || "N/A",
    },
    {
      width: "50px",
      selector: (row: any) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      ),
    },
  ];
  return <HeadlessTable columns={columns} data={data} onRowClicked={onEdit} />;
};

export default SLaDefinitionsTable;
