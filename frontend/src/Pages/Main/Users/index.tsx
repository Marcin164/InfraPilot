import UsersTable from "../../../Components/Tables/UsersTable";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import TableSettings from "../../../Components/TableSettings";
import { useQuery } from "@tanstack/react-query";
import { getFilter, getUsersTable } from "../../../Services/users";
import { useState } from "react";
import AddUserModal from "../../../Components/Modals/AddUserModal";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { getUserSettings } from "../../../Services/settings";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { buildQuery } from "../../../Helpers/queries";
import { useDebounce } from "../../../Hooks/useDebounce";
import { useFilterPresets } from "../../../Hooks/useFilterPresets";
import FilterPresetsBar from "../../../Components/Filter/FilterPresetsBar";

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
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);

  const presets = useFilterPresets("users", filters, (next) => {
    setFilters(next as FilterOptions);
    setPage(1);
  });

  const queryString = buildQuery({
    ...filters,
    search: debouncedSearch,
    page,
    limit,
  });

  const usersQuery = useQuery({
    queryKey: ["users", filters, debouncedSearch, page, limit],
    queryFn: () => getUsersTable(queryString),
    placeholderData: (prev) => prev,
  });

  const filtersQuery = useQuery({
    queryKey: ["usersFilters"],
    queryFn: () => getFilter(),
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setPage(1);
  };

  const checkboxes = [
    { name: "name", label: t("user.name") },
    { name: "username", label: t("user.username") },
    { name: "currentdevice", label: t("user.currentdevice") },
    { name: "lastLogon", label: t("user.lastlogon") },
    { name: "department", label: t("user.department") },
    { name: "office", label: t("user.office") },
    { name: "streetaddress", label: t("user.street") },
    { name: "country", label: t("user.country") },
  ];

  return (
    <PageMotion>
      <div className="h-[calc(100vh-58px)] w-full px-4">
        <div className="flex gap-2 py-4">
          <Filter
            filters={filters}
            setFilters={(next: any) => {
              setFilters(next);
              setPage(1);
              presets.clearActive();
            }}
            filterOptions={
              (filtersQuery?.data ?? {}) as Record<string, string[]>
            }
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onSavePreset={presets.savePreset}
          />
          <Search onChange={handleSearchChange} />
          <TableSettings
            settings={userSettings?.data}
            checkboxes={checkboxes}
            settingsKey="usersTableColumnOrder"
          />
          <ButtonPrimary
            color="white"
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
        <FilterPresetsBar
          presets={presets.presets}
          activePresetId={presets.activePreset?.id ?? null}
          onActivate={presets.activatePreset}
          onDelete={presets.deletePreset}
        />
        <UsersTable
          data={usersQuery.data?.data ?? []}
          total={usersQuery.data?.total ?? 0}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
          isLoading={usersQuery.isFetching}
        />
      </div>
    </PageMotion>
  );
};

export default UsersPage;
