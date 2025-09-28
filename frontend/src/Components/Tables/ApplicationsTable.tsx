import React from "react";
import MainTable from "./MainTable";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getApplicationsTable } from "../../Services/applications";

const ApplicationsTable = () => {
  let navigate = useNavigate();
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: getApplicationsTable,
  });

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
    },
    {
      name: "Installed on devices",
      selector: (row: any) => row.count,
    },
  ];

  if (!applicationsQuery?.data && applicationsQuery?.data?.length <= 0)
    return null;

  return (
    <MainTable
      columns={columns}
      data={applicationsQuery?.data}
      onRowClicked={(row: any) => navigate(`/applications/${row.id}`)}
    />
  );
};

export default ApplicationsTable;
