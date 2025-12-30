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

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [searchValue, setSearchValue] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersTable(accessToken),
    enabled: Boolean(accessToken),
  });

  const filtersQuery = useQuery({
    queryKey: ["users-filters"],
    queryFn: () => getFilter(accessToken),
    enabled: Boolean(accessToken),
  });

  const toggleFilterOption = (key: FilterKey, value: string) => {
    setFilters((prev) => {
      const values = prev[key];
      const exists = values.includes(value);

      return {
        ...prev,
        [key]: exists ? values.filter((v) => v !== value) : [...values, value],
      };
    });
  };

  if (usersQuery.isLoading) {
    return <div>Loading users…</div>;
  }

  if (usersQuery.isError) {
    return <div>Failed to load users</div>;
  }

  return (
    <div className="h-[calc(100vh-58px)] w-full px-4">
      <div className="flex gap-2 py-4">
        <Filter
          filterData={filtersQuery.data}
          filterOptions={filters}
          setFilters={toggleFilterOption}
        />
        <Search onChange={setSearchValue} />
        <TableSettings />
        <ButtonSecondary
          icon={faPlus}
          text={t("btn.add.user")}
          onClick={() => setIsAddUserModalOpen(true)}
          className="ml-2"
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
  );
};

export default UsersPage;
