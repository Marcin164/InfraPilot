import React from "react";
import MainTable from "./MainTable";
import { useNavigate } from "react-router";

type Props = {};

const FlowsTable = (props: Props) => {
  let navigate = useNavigate();

  const columns = [
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.name}</div>,
    },
    {
      name: "Creator",
      selector: (row: any) => row.creator,
    },
    {
      name: "State",
      cell: (row: any) => (
        <div className="w-[180px] py-2 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.state ? "Enabled" : "Disabled"}
        </div>
      ),
    },
    {
      name: "Created at",
      selector: (row: any) => row.createdAt,
    },
    {
      name: "Updated at",
      selector: (row: any) => row.updatedAt,
    },
  ];

  const data = [
    {
      id: 1,
      name: "Flow 1",
      creator: "nowakowskim",
      state: true,
      createdAt: "04/10/2025",
      updatedAt: "04/10/2025",
    },
  ];
  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => navigate(`/admin/flows/${row.id}`)}
    />
  );
};

export default FlowsTable;
