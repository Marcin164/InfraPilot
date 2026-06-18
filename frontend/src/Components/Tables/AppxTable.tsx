import React from "react";
import MainTable from "./MainTable";

type Props = { data: any };

const AppxTable = ({ data }: Props) => {
  const columns = [
    {
      name: "Name",
      cell: (row: any) => <div className="font-semibold text-[#3C3C3C]">{row.Name}</div>,
      width: "400px",
    },
    {
      name: "Package Full Name",
      selector: (row: any) => row.Publisher,
    },
    {
      name: "Version",
      selector: (row: any) => row.Version,
    },
    {
      name: "Architecture",
      selector: (row: any) => row.Architecture,
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => {}}
      className="h-[calc(100vh-270px)]"
    />
  );
};

export default AppxTable;
