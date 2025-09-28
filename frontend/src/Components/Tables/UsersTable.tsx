import { useNavigate } from "react-router";
import MainTable from "./MainTable";
import { useQuery } from "@tanstack/react-query";
import { getUsersTable } from "../../Services/users";
import moment from "moment";

type Props = {};

const UsersTable = (props: Props) => {
  let navigate = useNavigate();
  const userQuery = useQuery({ queryKey: ["users"], queryFn: getUsersTable });

  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => (
        <div className="font-bold">{row.users_displayName}</div>
      ),
    },
    {
      name: "Username",
      selector: (row: any) => row.users_username,
    },
    {
      name: "Current device",
      selector: (row: any) => row?.devices_system?.hostname || "N/A",
    },
    {
      name: "Last logon",
      cell: (row: any) => (
        <div className="w-[170px] py-2 px-1 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {moment(row.users_lastLogon).format("DD.MM.YYYY, hh:mm:ss")}
        </div>
      ),
    },
    {
      name: "Department",
      selector: (row: any) => row.users_department,
    },
    {
      name: "Office",
      selector: (row: any) => row.users_office,
    },
  ];

  if (!userQuery?.data && userQuery?.data?.length <= 0) return null;

  return (
    <MainTable
      columns={columns}
      data={userQuery?.data}
      onRowClicked={(row: any) => navigate(`/users/${row.users_id}`)}
    />
  );
};

export default UsersTable;
