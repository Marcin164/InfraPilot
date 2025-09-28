import React from "react";
import HeadlessTable from "./HeadlessTable";

type Props = { data: any };

const InstalledOnTable = ({ data }: Props) => {
  const columns = [
    {
      selector: (row: any) => row.system.hostname,
    },
    {
      selector: (row: any) => row.serialnumber,
    },
    {
      selector: (row: any) => row.username,
    },
  ];
  return <HeadlessTable columns={columns} data={data} />;
};

export default InstalledOnTable;
