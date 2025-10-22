import React from "react";
import MainTable from "./MainTable";

type Props = { data: any };

const SoftwareTable = ({ data }: Props) => {
  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.DisplayName}</div>,
      width: "400px",
    },
    {
      name: "Version",
      selector: (row: any) => row.DisplayVersion,
    },
    {
      name: "Publisher",
      selector: (row: any) => row.Publisher,
    },
    {
      name: "Size",
      selector: (row: any) => row.EstimatedSize,
      width: "100px",
    },
    {
      name: "Installation date",
      cell: (row: any) => row.InstallDate,
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

export default SoftwareTable;
