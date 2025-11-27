import { useNavigate } from "react-router";
import MainTable from "./MainTable";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { getFilteredData, getSearchedData } from "../../Helpers/tables";

type Props = { data: any; filterOptions: any; searchValue: string };

const UsersTable = ({ data, filterOptions, searchValue }: Props) => {
  let navigate = useNavigate();

  const columns = [
    {
      cell: (row: any) => (
        <div className="">
          <FontAwesomeIcon icon={faUser} />
        </div>
      ),
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => (
        <div className="font-bold">{`${row.name} ${row.surname}`}</div>
      ),
    },
    {
      name: "Username",
      selector: (row: any) => row.username,
    },
    {
      name: "Current device",
      selector: (row: any) => row.assetName || "N/A",
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
      selector: (row: any) => row.department || "N/A",
    },
    {
      name: "Office",
      selector: (row: any) => row.office || "N/A",
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={getFilteredData(getSearchedData(data, searchValue), filterOptions)}
      onRowClicked={(row: any) => navigate(`/users/${row.id}`)}
    />
  );
};

export default UsersTable;
