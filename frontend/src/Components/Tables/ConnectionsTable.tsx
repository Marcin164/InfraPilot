import React from "react";
import MainTable from "./MainTable";

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
      selector: (row: any) => row.status,
      width: "140px",
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
