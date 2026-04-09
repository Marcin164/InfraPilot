import { Link, useNavigate } from "react-router";
import MainTable from "./MainTable";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "../../Services/settings";

import type { User } from "../../Types";

type Props = {
  data: User[];
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
};

const UsersTable = ({
  data,
  total,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
}: Props) => {
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!userSettings.data || userSettings.isLoading) {
    return <div>Loading...</div>;
  }

  const columns = [
    {
      cell: (_row: any) => (
        <div>
          <FontAwesomeIcon icon={faUser} />
        </div>
      ),
      width: "60px",
    },
    {
      id: "name",
      name: t("user.name"),
      selector: (row: any) => (
        <span className="font-bold">{`${row.name ?? ""} ${row.surname ?? ""}`}</span>
      ),
    },
    {
      id: "username",
      name: t("user.username"),
      selector: (row: any) => row.username,
    },
    {
      id: "currentdevice",
      name: t("user.currentdevice"),
      selector: (row: any) =>
        row.assetname ? (
          <Link
            to={`/devices/${row.deviceid}/system`}
            className="text-[#2B9AE9] underline"
          >
            {row.assetname}
          </Link>
        ) : (
          "N/A"
        ),
    },
    {
      id: "lastlogon",
      name: t("user.lastlogon"),
      cell: (row: any) => (
        <div className="w-[170px] py-2 px-1 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.lastlogon
            ? moment(row.lastlogon).format("DD.MM.YYYY, hh:mm:ss")
            : "N/A"}
        </div>
      ),
    },
    {
      id: "department",
      name: t("user.department"),
      selector: (row: any) => row.department || "N/A",
    },
    {
      id: "office",
      name: t("user.office"),
      selector: (row: any) => row.office || "N/A",
    },
    {
      id: "streetaddress",
      name: t("user.street"),
      selector: (row: any) => row.street || "N/A",
    },
    {
      id: "country",
      name: t("user.country"),
      selector: (row: any) => row.country || "N/A",
    },
  ];

  const filterColumns = () => {
    return (userSettings.data.usersTableColumnOrder ?? [])
      .map((columnId: string) =>
        columns.find((column: any) => column.id === columnId.toLowerCase()),
      )
      .filter(Boolean);
  };

  return (
    <MainTable
      columns={filterColumns()}
      data={data}
      onRowClicked={(row: any) => navigate(`/users/${row.id}`)}
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
    />
  );
};

export default UsersTable;
