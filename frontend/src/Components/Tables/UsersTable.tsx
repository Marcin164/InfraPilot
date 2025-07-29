import React from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router";

type Props = {};

const UsersTable = (props: Props) => {
  let navigate = useNavigate();

  const customStyles = {
    table: {
      style: {
        width: "100%",
        background: "transparent",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#FFFFFF",
        fontWeight: "bold",
        borderRadius: "10px",
        fontSize: "18px",
      },
    },
    rows: {
      style: {
        minHeight: "48px",
        borderBottomColor: "#eee",
        transition: "all 0.2s ease-in-out",
        margin: "5px 0 5px 0",
        borderRadius: "10px",
        fontSize: "18px",
        "&:hover": {
          backgroundColor: "#d2ecff", // NIEBIESKI hover
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "#d2ecff",
        outline: "none",
      },
    },
  };

  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.name}</div>,
    },
    {
      name: "Username",
      selector: (row: any) => row.username,
    },
    {
      name: "Current device",
      selector: (row: any) => row.currentDevice,
    },
    {
      name: "Last logon",
      cell: (row: any) => (
        <div className="w-[180px] py-2 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.lastLogon}
        </div>
      ),
    },
    {
      name: "Department",
      selector: (row: any) => row.department,
    },
    {
      name: "Office",
      selector: (row: any) => row.office,
    },
  ];

  const data = [
    {
      id: "1",
      name: "Marcin Nowakowski",
      username: "nowakowskim",
      currentDevice: "Macbook M3 Pro",
      lastLogon: "24/04/2025, 18:25",
      department: "Helpdesk",
      office: "Labs-WRO",
    },
  ];

  return (
    <DataTable
      className=""
      pagination
      columns={columns}
      data={data}
      customStyles={customStyles}
      onRowClicked={(row) => navigate(`/users/${row.id}`)}
      highlightOnHover
      pointerOnHover
      responsive
    />
  );
};

export default UsersTable;
