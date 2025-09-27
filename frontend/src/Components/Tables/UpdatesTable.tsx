import React from "react";
import HeadlessTable from "./HeadlessTable";

type Props = { data: any };

const UpdatesTable = ({ data }: Props) => {
  const columns = [
    {
      selector: (row: any) => row.hotfix_id,
      width: "150px",
    },
    {
      selector: (row: any) => row.description,
      width: "150px",
    },
    {
      selector: (row: any) => row.installedOn,
      width: "150px",
    },
  ];

  return <HeadlessTable columns={columns} data={data} />;
};

export default UpdatesTable;
