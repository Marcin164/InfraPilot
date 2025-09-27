import React from "react";
import HeadlessTable from "./HeadlessTable";

type Props = { data: any };

const StartupAppsTable = ({ data }: Props) => {
  const columns = [
    {
      selector: (row: any) => row.name,
      width: "150px",
    },
    {
      selector: (row: any) => row.location,
      width: "150px",
    },
    {
      selector: (row: any) => row.command,
      width: "150px",
    },
  ];

  return <HeadlessTable columns={columns} data={data} />;
};

export default StartupAppsTable;
