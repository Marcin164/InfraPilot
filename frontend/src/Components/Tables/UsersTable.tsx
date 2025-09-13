import { useNavigate } from "react-router";
import MainTable from "./MainTable";
import { parseToUsersTable } from "../../Helpers/tables";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../Services/users";

type Props = {};

const UsersTable = (props: Props) => {
  let navigate = useNavigate();
  const userQuery = useQuery({ queryKey: ["users"], queryFn: getUsers });

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

  if (!userQuery?.data && userQuery?.data?.length <= 0) return null;

  return (
    <MainTable
      columns={columns}
      data={parseToUsersTable(userQuery?.data)}
      onRowClicked={(row: any) => navigate(`/users/${row.id}`)}
    />
  );
};

export default UsersTable;
