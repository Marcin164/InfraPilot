import MainTable from "./MainTable";
import { Link, useNavigate } from "react-router";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputer } from "@fortawesome/free-solid-svg-icons";

type Props = {
  data: any[];
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
};

const DevicesTable = ({
  data,
  total,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
}: Props) => {
  const navigate = useNavigate();

  const columns = [
    {
      cell: (_row: any) => (
        <div>
          <FontAwesomeIcon icon={faComputer} />
        </div>
      ),
      width: "60px",
    },
    {
      name: "Device",
      cell: (row: any) => (
        <span className="font-bold">{`${row.manufacturer ?? ""} ${row.model ?? ""}`}</span>
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
          {row.varranty ? moment(row.varranty).format("DD.MM.YYYY") : "N/A"}
        </div>
      ),
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => navigate(`/devices/${row.id}/system`)}
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
    />
  );
};

export default DevicesTable;
