import UsersTable from "../../../Components/Tables/UsersTable";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import TableSettings from "../../../Components/TableSettings";
import { useQuery } from "@tanstack/react-query";
import { getFilter, getUsersTable } from "../../../Services/users";
import { useState } from "react";
import { useAuthInfo } from "@propelauth/react";
import AddUserModal from "../../../Components/Modals/AddUserModal";
import ButtonSecondary from "../../../Components/Buttons/ButtonSecondary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { getUserSettings } from "../../../Services/settings";
import { motion } from "framer-motion";
import PageMotion from "../../../Components/PageMotion/PageMotion";

export type FilterKey =
  | "department"
  | "company"
  | "office"
  | "city"
  | "country"
  | "title"
  | "streetAddress"
  | "postalCode"
  | "manager";

export type FilterOptions = Record<FilterKey, string[]>;

const INITIAL_FILTERS: FilterOptions = {
  department: [],
  company: [],
  office: [],
  city: [],
  country: [],
  title: [],
  streetAddress: [],
  postalCode: [],
  manager: [],
};

const UsersPage = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuthInfo();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [searchValue, setSearchValue] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersTable(accessToken),
    enabled: Boolean(accessToken),
  });

  const filtersQuery = useQuery({
    queryKey: ["usersFilters"],
    queryFn: () => getFilter(accessToken),
    enabled: Boolean(accessToken),
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => {
      return getUserSettings(accessToken);
    },
  });

  if (usersQuery.isLoading) {
    return <div>Loading users…</div>;
  }

  if (usersQuery.isError) {
    return <div>Failed to load users</div>;
  }

  const checkboxes = [
    {
      name: "name",
      label: "Name",
    },
    {
      name: "username",
      label: "Username",
    },
    {
      name: "currentdevice",
      label: "Current device",
    },
    {
      name: "lastLogon",
      label: "Last logon",
    },
    {
      name: "department",
      label: "Department",
    },
    {
      name: "office",
      label: "Office",
    },
    {
      name: "streetaddress",
      label: "Street address",
    },
    {
      name: "country",
      label: "Country",
    },
  ];

  return (
    <PageMotion>
      <div className="h-[calc(100vh-58px)] w-full px-4">
        <div className="flex gap-2 py-4">
          <Filter
            filters={filters}
            setFilters={setFilters}
            filterOptions={filtersQuery?.data}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
          <Search onChange={setSearchValue} />
          <TableSettings
            settings={userSettings?.data}
            checkboxes={checkboxes}
            settingsKey="usersTableColumnOrder"
          />
          <ButtonSecondary
            icon={faPlus}
            text={t("btn.add.user")}
            onClick={() => setIsAddUserModalOpen(true)}
            className="h-[34px] ml-2"
          />
          <AddUserModal
            isModalOpen={isAddUserModalOpen}
            onCloseModal={() => setIsAddUserModalOpen(false)}
          />
        </div>
        <UsersTable
          data={usersQuery.data ?? []}
          filterOptions={filters}
          searchValue={searchValue}
        />
      </div>
    </PageMotion>
  );
};

export default UsersPage;
