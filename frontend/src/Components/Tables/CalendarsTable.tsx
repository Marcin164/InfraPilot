import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import HeadlessTable from "./HeadlessTable";
import { parseWorkdays } from "../../Helpers/forms";

type Props = {
  data: any[];
  onEdit: any;
  onDelete: (row: any) => void;
};

const CalendarsTable = ({ data, onEdit, onDelete }: Props) => {
  const columns = [
    {
      selector: (row: any) => row.name,
      width: "40%",
    },
    {
      selector: (row: any) =>
        parseWorkdays(row?.workingDays).map((day: any) => (
          <span
            className="px-2 mx-1 bg-[#30A712] rounded-xl text-white"
            key={day}
          >
            {day}
          </span>
        )),
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
  return (
    <HeadlessTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => onEdit(row)}
    />
  );
};

export default CalendarsTable;
