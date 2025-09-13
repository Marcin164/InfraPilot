import React from "react";
import MainTable from "./MainTable";
import { parseToSoftwareTable } from "../../Helpers/tables";

type Props = { data: any };

const SoftwareTable = ({ data }: Props) => {
  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.name}</div>,
      width: "400px",
    },
    {
      name: "Version",
      selector: (row: any) => row.version,
    },
    {
      name: "Publisher",
      selector: (row: any) => row.publisher,
    },
    {
      name: "Size",
      selector: (row: any) => row.size,
      width: "100px",
    },
    {
      name: "Installation date",
      selector: (row: any) => row.installationDate,
    },
  ];

  //   const data = [
  //     {
  //       name: "Android Studio",
  //       version: "2024.2",
  //       publisher: "Google Inc.",
  //       size: "7.6 GB",
  //       installationDate: "30.01.2025",
  //     },
  //   ];

  return (
    <MainTable
      columns={columns}
      data={parseToSoftwareTable(data)}
      onRowClicked={(row: any) => {}}
      className="h-[calc(100vh-270px)]"
    />
  );
};

export default SoftwareTable;
