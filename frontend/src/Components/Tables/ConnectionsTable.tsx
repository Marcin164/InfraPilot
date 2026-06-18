import MainTable from "./MainTable";
import StatusPill from "../Badges/StatusPill";

type Props = { data: any };

const ConnectionsTable = ({ data }: Props) => {
  const columns = [
    {
      name: "PID",
      selector: (row: any) => row.pid,
      width: "100px",
    },
    {
      name: "Process",
      selector: (row: any) => row.process_name || "N/A",
      width: "140px",
    },
    {
      name: "Family",
      selector: (row: any) => row.family,
      width: "100px",
    },
    {
      name: "Type",
      selector: (row: any) => row.type,
      width: "140px",
    },
    {
      name: "Status",
      cell: (row: any) => (
        <StatusPill
          tone={row.status === "ESTABLISHED" ? "green" : row.status === "LISTEN" ? "blue" : "gray"}
          text={row.status}
        />
      ),
      width: "150px",
    },
    {
      name: "Local address",
      selector: (row: any) => row.laddr,
      width: "380px",
    },
    {
      name: "Remote address",
      selector: (row: any) => row.raddr,
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default ConnectionsTable;
