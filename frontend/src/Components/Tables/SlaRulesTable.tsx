import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import HeadlessTable from "./HeadlessTable";

type Props = {
  data: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
};

const SlaRulesTable = ({ data, onEdit, onDelete }: Props) => {
  const parsePriorityClassName = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "High":
        return "bg-orange-500";
      case "Critical":
        return "bg-red-500";
      default:
        return "";
    }
  };

  const columns = [
    {
      name: "Priority",
      selector: (row: any) => (
        <span
          className={`px-2 mx-1 rounded-xl text-white ${parsePriorityClassName(row.priority)}`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Ticket Type",
      selector: (row: any) => row.ticketType || "Any",
    },
    {
      name: "Definition",
      selector: (row: any) => row.slaDefinition?.name,
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

export default SlaRulesTable;
