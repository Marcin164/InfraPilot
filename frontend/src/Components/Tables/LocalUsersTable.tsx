import React from "react";
import MainTable from "./MainTable";
import Badge from "../Badges/Badge";
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
        <span className="font-bold">{row.FullName || row.Name}</span>
      ),
    },
    {
      name: "Type",
      selector: (row: any) =>
        parseAccountType.find(
          (type: any) => type.accountType === row?.AccountType
        )?.accountTypeName,
    },
    {
      name: "Disabled",
      cell: (row: any) => (
        <Badge
          icon={row.Disabled ? faLock : faLockOpen}
          className={row.Disabled ? "bg-[#BC0E0E]" : "bg-[#30A712]"}
          text={row.Disabled ? "Disabled" : "Enabled"}
        />
      ),
    },
    {
      name: "Password Changeable",
      cell: (row: any) => (
        <Badge
          className={
            row.PasswordChangeable
              ? "text-[#30A712] font-bold"
              : "text-[#BC0E0E] font-bold"
          }
          text={row.PasswordChangeable ? "Yes" : "No"}
        />
      ),
    },
    {
      name: "Password Expires",
      cell: (row: any) => (
        <Badge
          className={
            row.PasswordExpires
              ? "text-[#30A712] font-bold"
              : "text-[#BC0E0E] font-bold"
          }
          text={row.PasswordExpires ? "Yes" : "No"}
        />
      ),
    },
    {
      name: "Password Required",
      cell: (row: any) => (
        <Badge
          className={
            row.PasswordRequired
              ? "text-[#30A712] font-bold"
              : "text-[#BC0E0E] font-bold"
          }
          text={row.PasswordRequired ? "Yes" : "No"}
        />
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
