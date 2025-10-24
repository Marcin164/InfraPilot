import React from "react";
import MainTable from "./MainTable";

type Props = { data: any };

const LocalGroupsTable = ({ data }: Props) => {
  if (!data) return null;

  const columns = [
    {
      name: "Name",
      cell: (row: any) => <span className="font-bold">{row.Name}</span>,
      width: "300px",
    },
    {
      name: "Description",
      selector: (row: any) => row.Description,
    },
    {
      name: "Status",
      selector: (row: any) => row.Status,
      width: "200px",
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default LocalGroupsTable;
