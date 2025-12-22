import { Link, useNavigate } from "react-router";
import MainTable from "./MainTable";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { getFilteredData, getSearchedData } from "../../Helpers/tables";
import { useTranslation } from "react-i18next";

type Props = { data: any; filterOptions: any; searchValue: string };

const UsersTable = ({ data, filterOptions, searchValue }: Props) => {
  let navigate = useNavigate();
  const { t } = useTranslation();

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
      name: t("user.name"),
      selector: (row: any) => (
        <span className="font-bold">{`${row.name} ${row.surname}`}</span>
      ),
    },
    {
      name: t("user.username"),
      selector: (row: any) => row.username,
    },
    {
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
      name: t("user.lastlogon"),
      cell: (row: any) => (
        <div className="w-[170px] py-2 px-1 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {moment(row.lastlogon).format("DD.MM.YYYY, hh:mm:ss")}
        </div>
      ),
    },
    {
      name: t("user.department"),
      selector: (row: any) => row.department || "N/A",
    },
    {
      name: t("user.office"),
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
