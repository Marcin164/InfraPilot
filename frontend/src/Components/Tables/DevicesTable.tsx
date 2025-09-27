import React from "react";
import MainTable from "./MainTable";
import { useNavigate } from "react-router";
import moment from "moment";
import { getDevices } from "../../Services/devices";
import { useQuery } from "@tanstack/react-query";
import { parseToDeviceTable } from "../../Helpers/tables";

type Props = {};

const DevicesTable = (props: Props) => {
  let navigate = useNavigate();
  const deviceQuery = useQuery({ queryKey: ["devices"], queryFn: getDevices });

  console.log(deviceQuery.data);
  const columns = [
    {
      cell: (row: any) => <div className="">{row.id}</div>,
      width: "60px",
    },
    {
      name: "Device",
      cell: (row: any) => <span>{`${row.manufacturer} ${row.model}`}</span>,
      width: "200px",
    },
    {
      name: "Assignee",
      selector: (row: any) => row.ownerId,
      width: "160px",
    },
    {
      name: "State",
      cell: (row: any) => (
        <div className="w-[100px] py-2 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.state ? "Online" : "Offline"}
        </div>
      ),
      width: "120px",
    },
    {
      name: "Asset name",
      selector: (row: any) => row.system.hostname,
      width: "140px",
    },
    {
      name: "Serial number",
      selector: (row: any) => row.serialNumber,
      width: "210px",
    },
    {
      name: "Varranty",
      cell: (row: any) => (
        <div
          style={{
            color: row.varranty < new Date().getTime() ? "#F3606E" : "#3C3C3C",
          }}
        >
          {moment(row.varranty).format("DD.MM.YYYY")}
        </div>
      ),
    },
  ];

  if (!deviceQuery?.data && deviceQuery?.data?.length <= 0) return null;

  return (
    <MainTable
      columns={columns}
      data={deviceQuery?.data}
      onRowClicked={(row: any) => navigate(`/devices/${row.id}/systeminfo`)}
    />
  );
};

export default DevicesTable;
