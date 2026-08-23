import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import HeadlessTable from "./HeadlessTable";

type Props = {
  data: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
};

const formatMinutes = (minutes: number | null | undefined) => {
  if (!minutes) return "—";
  if (minutes % (24 * 60) === 0) return `${minutes / (24 * 60)}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
};

const SLaDefinitionsTable = ({ data, onEdit, onDelete }: Props) => {
  const columns = [
    {
      name: "Name",
      selector: (row: any) => row.name,
    },
    {
      name: "Response",
      selector: (row: any) => formatMinutes(row.responseMinutes),
      width: "100px",
    },
    {
      name: "Resolution",
      selector: (row: any) => formatMinutes(row.resolutionMinutes),
      width: "100px",
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
