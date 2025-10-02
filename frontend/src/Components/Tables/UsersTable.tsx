import { useNavigate } from "react-router";
import MainTable from "./MainTable";
import moment from "moment";

type Props = { data: any; filterOptions: any };

const UsersTable = ({ data, filterOptions }: Props) => {
  let navigate = useNavigate();

  const getFilteredData = () => {
    const arrayLength = Object.values(filterOptions).reduce(
      (acc, arr: any) => acc + arr.length,
      0
    );

    if (arrayLength === 0) return data;

    return data.filter((d: any) =>
      Object.entries(filterOptions).every(([key, optionsArray]: any) => {
        if (!optionsArray.length) return true;
        return optionsArray.includes(d[key]);
      })
    );
  };

  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.displayname}</div>,
    },
    {
      name: "Username",
      selector: (row: any) => row.username,
    },
    {
      name: "Current device",
      selector: (row: any) => row?.system?.hostname || "N/A",
    },
    {
      name: "Last logon",
      cell: (row: any) => (
        <div className="w-[170px] py-2 px-1 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {moment(row.lastlogon).format("DD.MM.YYYY, hh:mm:ss")}
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

  return (
    <MainTable
      columns={columns}
      data={getFilteredData()}
      onRowClicked={(row: any) => navigate(`/users/${row.id}`)}
    />
  );
};

export default UsersTable;
