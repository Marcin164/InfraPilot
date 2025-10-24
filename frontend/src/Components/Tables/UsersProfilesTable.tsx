import React from "react";
import MainTable from "./MainTable";
import Badge from "../Badges/Badge";

type Props = { data: any };

const UsersProfilesTable = ({ data }: Props) => {
  if (!data) return null;

  const parseStatus = ["OK", "Error", "Degraded", "Unknown"];
  const parseHealth = [
    {
      backgroundColor: "#535353",
      text: "Unknown",
    },
    {
      backgroundColor: "#30A712",
      text: "Healthy",
    },
    {
      backgroundColor: "#F3606E",
      text: "Degraded",
    },
    {
      backgroundColor: "#AFBA17",
      text: "Warning",
    },
    {
      backgroundColor: "#BC0E0E",
      text: "Unhealthy",
    },
  ];
  const parseSpecial = [];

  const columns = [
    {
      name: "Path",
      cell: (row: any) => <span className="font-bold">{row.LocalPath}</span>,
      width: "300px",
    },
    {
      name: "Last Use",
      selector: (row: any) => row.LastUseTime,
    },
    {
      name: "Health",
      cell: (row: any) => (
        <Badge
          className={`bg-[${parseHealth[row.HealthStatus].backgroundColor}]`}
          text={parseHealth[row.HealthStatus].text}
        />
      ),
    },
    {
      name: "Loaded",
      selector: (row: any) => (
        <Badge
          className={
            row.Loaded ? "text-[#30A712] font-bold" : "text-[#BC0E0E] font-bold"
          }
          text={row.Loaded ? "Yes" : "No"}
        />
      ),
    },
    {
      name: "Roaming",
      cell: (row: any) => (
        <Badge
          className={!row.Roaming ? "text-[#BC0E0E] font-bold" : ""}
          text={row.Roaming ? row.RoamingPath : "No"}
        />
      ),
    },
    {
      name: "Temporary",
      cell: (row: any) => (
        <Badge
          className={
            row.Temporary
              ? "text-[#30A712] font-bold"
              : "text-[#BC0E0E] font-bold"
          }
          text={row.Temporary ? "Yes" : "No"}
        />
      ),
    },
    {
      name: "Status",
      selector: (row: any) => parseStatus[row.Status],
    },
    {
      name: "Special",
      cell: (row: any) => (
        <Badge
          className={
            row.Special
              ? "text-[#30A712] font-bold"
              : "text-[#BC0E0E] font-bold"
          }
          text={row.Special ? "Yes" : "No"}
        />
      ),
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default UsersProfilesTable;
