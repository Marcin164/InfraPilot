import MainTable from "./MainTable";
import { Link, useNavigate } from "react-router";
import moment from "moment";
import { getFilteredData, getSearchedData } from "../../Helpers/tables";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputer } from "@fortawesome/free-solid-svg-icons";

type Props = {
  data: any;
  filterOptions: any;
  searchValue: any;
};

const DevicesTable = ({ data, filterOptions, searchValue }: Props) => {
  let navigate = useNavigate();

  const columns = [
    {
      cell: (row: any) => (
        <div>
          <FontAwesomeIcon icon={faComputer} />
        </div>
      ),
      width: "60px",
    },
    {
      name: "Device",
      cell: (row: any) => (
        <span className="font-bold">{`${row.manufacturer} ${row.model}`}</span>
      ),
      width: "200px",
    },
    {
      name: "Assignee",
      selector: (row: any) =>
        row?.user ? (
          <Link
            to={`/users/${row.user.id}`}
            className="text-[#2B9AE9] underline"
          >
            {row?.user?.distinguishedName}
          </Link>
        ) : (
          "N/A"
        ),
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
      selector: (row: any) => row.assetName || "N/A",
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

  return (
    <MainTable
      columns={columns}
      data={getFilteredData(getSearchedData(data, searchValue), filterOptions)}
      onRowClicked={(row: any) => navigate(`/devices/${row.id}/system`)}
    />
  );
};

export default DevicesTable;
