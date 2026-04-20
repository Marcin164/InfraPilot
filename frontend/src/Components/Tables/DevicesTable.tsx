import MainTable from "./MainTable";
import { Link, useNavigate } from "react-router";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputer } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "../../Services/settings";

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
  const { t } = useTranslation();
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  if (!userSettings.data || userSettings.isLoading) {
    return <div>Loading...</div>;
  }

  const iconColumn = {
    id: "icon",
    cell: (_row: any) => (
      <div>
        <FontAwesomeIcon icon={faComputer} />
      </div>
    ),
    width: "60px",
  };

  const columns = [
    iconColumn,
    {
      id: "device",
      name: t("device.device"),
      cell: (row: any) => (
        <span className="font-bold">{`${row.manufacturer ?? ""} ${row.model ?? ""}`}</span>
      ),
      width: "200px",
    },
    {
      id: "user",
      name: t("device.device"),
      selector: (row: any) =>
        row?.user ? (
          <Link
            to={`${row.user.id}`}
            className="text-[#2B9AE9] underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row?.user?.distinguishedName}
          </Link>
        ) : (
          "N/A"
        ),
      width: "160px",
    },
    {
      id: "state",
      name: t("device.state"),
      cell: (row: any) => (
        <div className="w-[100px] py-2 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.state ? "Online" : "Offline"}
        </div>
      ),
      width: "120px",
    },
    {
      id: "assetname",
      name: t("device.assetname"),
      selector: (row: any) => row.assetName || "N/A",
      width: "140px",
    },
    {
      id: "serialnumber",
      name: t("device.serial.number"),
      selector: (row: any) => row.serialNumber,
      width: "210px",
    },
    {
      id: "warranty",
      name: t("device.varranty"),
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

  const filterColumns = () => {
    const order = userSettings.data?.devicesTableColumnOrder;
    if (!order || order.length === 0) {
      return columns;
    }
    const filtered = order
      .map((columnId: string) =>
        columns.find((column) => column.id === columnId.toLowerCase()),
      )
      .filter(Boolean);
    return [iconColumn, ...filtered];
  };

  return (
    <MainTable
      columns={filterColumns()}
      data={data}
      onRowClicked={(row: any) => navigate(`/admin/devices/${row.id}/system`)}
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
    />
  );
};

export default DevicesTable;
