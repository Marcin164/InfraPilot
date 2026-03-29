import { Link, useNavigate } from "react-router";
import MainTable from "./MainTable";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { getFilteredData, getSearchedData } from "../../Helpers/tables";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "../../Services/settings";

type Props = { data: any; filterOptions: any; searchValue: string };

const UsersTable = ({ data, filterOptions, searchValue }: Props) => {
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });
  let navigate = useNavigate();
  const { t } = useTranslation();

  if (!userSettings.data || userSettings.isLoading) {
    return <div>Loading...</div>;
  }

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
      id: "name",
      name: t("user.name"),
      selector: (row: any) => (
        <span className="font-bold">{`${row.name} ${row.surname}`}</span>
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
          {moment(row.lastlogon).format("DD.MM.YYYY, hh:mm:ss")}
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
    return userSettings.data.usersTableColumnOrder
      .map((columnId: string) =>
        columns.find((column: any) => column.id === columnId.toLowerCase()),
      )
      .filter(Boolean);
  };

  return (
    <MainTable
      columns={filterColumns()}
      data={getFilteredData(getSearchedData(data, searchValue), filterOptions)}
      onRowClicked={(row: any) => navigate(`/users/${row.id}`)}
    />
  );
};

export default UsersTable;
