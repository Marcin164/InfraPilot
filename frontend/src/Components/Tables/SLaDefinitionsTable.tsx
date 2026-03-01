import HeadlessTable from "./HeadlessTable";

type Props = {
  data: any[];
  onEdit: (row: any) => void;
};

const SLaDefinitionsTable = ({ data, onEdit }: Props) => {
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
  ];
  return <HeadlessTable columns={columns} data={data} onRowClicked={onEdit} />;
};

export default SLaDefinitionsTable;
