import MainTable from "./MainTable";
import StatusPill from "../Badges/StatusPill";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";

type Props = { data: any };

const UsersGroupsTable = ({ data }: Props) => {
  if (!data) return null;

  const parseAccountType = [
    {
      accountType: 256,
      accountTypeName: "Temporary duplicate",
    },
    {
      accountType: 512,
      accountTypeName: "Normal",
    },
    {
      accountType: 2048,
      accountTypeName: "Interdomain trust",
    },
    {
      accountType: 4096,
      accountTypeName: "Workstation trust",
    },
    {
      accountType: 8192,
      accountTypeName: "Server trust",
    },
  ];

  const columns = [
    {
      name: "Name",
      cell: (row: any) => (
        <span className="font-semibold text-[#3C3C3C]">{row.FullName || row.Name}</span>
      ),
    },
    {
      name: "Type",
      selector: (row: any) =>
        parseAccountType.find(
          (type: any) => type.accountType === row?.AccountType
        )?.accountTypeName ?? "Unknown",
    },
    {
      name: "Disabled",
      cell: (row: any) => (
        <StatusPill
          icon={row.Disabled ? faLock : faLockOpen}
          tone={row.Disabled ? "red" : "green"}
          text={row.Disabled ? "Disabled" : "Enabled"}
        />
      ),
    },
    {
      name: "Password Changeable",
      cell: (row: any) => (
        <StatusPill tone={row.PasswordChangeable ? "green" : "red"} text={row.PasswordChangeable ? "Yes" : "No"} />
      ),
    },
    {
      name: "Password Expires",
      cell: (row: any) => (
        <StatusPill tone={row.PasswordExpires ? "green" : "red"} text={row.PasswordExpires ? "Yes" : "No"} />
      ),
    },
    {
      name: "Password Required",
      cell: (row: any) => (
        <StatusPill tone={row.PasswordRequired ? "green" : "red"} text={row.PasswordRequired ? "Yes" : "No"} />
      ),
    },
    {
      name: "Status",
      selector: (row: any) => row.Status,
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default UsersGroupsTable;
