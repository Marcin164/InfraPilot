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
    { name: "device", label: "Device" },
    { name: "user", label: "User" },
    { name: "state", label: "State" },
    { name: "assetname", label: "Asset name" },
    { name: "serialnumber", label: "Serial number" },
    { name: "warranty", label: "Warranty" },
  ];

  useEffect(() => {
    if (params.id) navigate(`/devices/${params.id}/systeminfo`);
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
        <div className="flex gap-2 py-4">
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
          <Search onChange={handleSearchChange} />
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
          <AddDeviceModal isModalOpen={addEQModal} onCloseModal={toggleModal} />
        </div>
        <FilterPresetsBar
          presets={presets.presets}
          activePresetId={presets.activePreset?.id ?? null}
          onActivate={presets.activatePreset}
          onDelete={presets.deletePreset}
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
        />
      </div>
    </PageMotion>
  );
};

export default Index;
