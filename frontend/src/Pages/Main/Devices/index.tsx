import { useEffect, useState } from "react";
import DevicesTable from "../../../Components/Tables/DevicesTable";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevices, getFilter } from "../../../Services/devices";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import AddDeviceModal from "../../../Components/Modals/AddDeviceModal";
import { buildQuery } from "../../../Helpers/queries";
import { useDebounce } from "../../../Hooks/useDebounce";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { useTranslation } from "react-i18next";
import { useFilterPresets } from "../../../Hooks/useFilterPresets";
import FilterPresetsBar from "../../../Components/Filter/FilterPresetsBar";
import TableSettings from "../../../Components/TableSettings";
import { getUserSettings } from "../../../Services/settings";
import MassActionBar from "./components/MassActionBar";

type DeviceFilters = {
  group?: string[];
  model?: string[];
  subgroup?: string[];
  state?: string[];
  location?: string[];
  manufacturer?: string[];
};

const INITIAL_FILTERS: DeviceFilters = {
  group: [],
  model: [],
  subgroup: [],
  state: [],
  location: [],
  manufacturer: [],
};

const Index = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DeviceFilters>(INITIAL_FILTERS);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearSelection, setClearSelection] = useState(0);

  const presets = useFilterPresets("devices", filters, (next) => {
    setFilters(next as DeviceFilters);
    setPage(1);
  });
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [addEQModal, setAddEQModal] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);

  const queryString = buildQuery({
    ...filters,
    search: debouncedSearch,
    page,
    limit,
  });

  const devicesQuery = useQuery({
    queryKey: ["devices", filters, debouncedSearch, page, limit],
    queryFn: () => getDevices(queryString),
    placeholderData: (prev) => prev,
  });

  const filterQuery = useQuery({
    queryKey: ["devicesFilters"],
    queryFn: () => getFilter(),
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const deviceCheckboxes = [
    { name: "device", label: t("table.device.column.device") },
    { name: "user", label: t("table.device.column.user") },
    { name: "state", label: t("table.device.column.state") },
    { name: "assetname", label: t("table.device.column.assetname") },
    { name: "serialnumber", label: t("table.device.column.serialnumber") },
    { name: "warranty", label: t("table.device.column.warranty") },
    { name: "tags", label: t("table.device.column.tags", "Tags") },
  ];

  useEffect(() => {
    if (params.id) navigate(`/admin/devices/${params.id}/systeminfo`);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setPage(1);
  };

  const toggleModal = () => {
    setAddEQModal((prev) => !prev);
  };

  return (
    <PageMotion>
      <div className="w-full h-[calc(100vh-58px)] px-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 py-4">
          <Filter
            filters={filters as any}
            setFilters={(next: any) => {
              setFilters(next);
              setPage(1);
              presets.clearActive();
            }}
            filterOptions={
              (filterQuery?.data ?? {}) as Record<string, string[]>
            }
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onSavePreset={presets.savePreset}
          />
          <Search
            onChange={handleSearchChange}
            className="w-auto flex-1 min-w-[180px] max-w-[400px]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <TableSettings
              settings={userSettings?.data}
              checkboxes={deviceCheckboxes}
              settingsKey="devicesTableColumnOrder"
            />
            <ButtonPrimary
              color="white"
              icon={faPlus}
              text={t("btn.add.device")}
              onClick={toggleModal}
            />
          </div>
          <AddDeviceModal isModalOpen={addEQModal} onCloseModal={toggleModal} />
        </div>
        <FilterPresetsBar
          presets={presets.presets}
          activePresetId={presets.activePreset?.id ?? null}
          onActivate={presets.activatePreset}
          onDelete={presets.deletePreset}
        />
        <MassActionBar
          selectedIds={selectedIds}
          onCleared={() => {
            setSelectedIds([]);
            setClearSelection((x) => x + 1);
          }}
        />
        <DevicesTable
          data={devicesQuery.data?.data ?? []}
          total={devicesQuery.data?.total ?? 0}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
          isLoading={devicesQuery.isFetching}
          selectable
          onSelectedRowsChange={(rows) =>
            setSelectedIds(rows.map((r: any) => r.id))
          }
          clearSelection={Boolean(clearSelection)}
        />
      </div>
    </PageMotion>
  );
};

export default Index;
