import { useEffect, useState } from "react";
import DevicesTable from "../../../Components/Tables/DevicesTable";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevices, getFilter } from "../../../Services/devices";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonSecondary from "../../../Components/Buttons/ButtonSecondary";
import AddDeviceModal from "../../../Components/Modals/AddDeviceModal";
import { buildQuery } from "../../../Helpers/queries";
import { useDebounce } from "../../../Hooks/useDebounce";

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

  const [filters, setFilters] = useState<DeviceFilters>(INITIAL_FILTERS);
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="pt-4 pb-4 flex gap-2">
        <Filter
          filters={filters as any}
          setFilters={(next: any) => {
            setFilters(next);
            setPage(1);
          }}
          filterOptions={(filterQuery?.data ?? {}) as Record<string, string[]>}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
        <Search onChange={handleSearchChange} />
        <ButtonSecondary
          icon={faPlus}
          text="Add device"
          onClick={toggleModal}
        />
        <AddDeviceModal isModalOpen={addEQModal} onCloseModal={toggleModal} />
      </div>
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
  );
};

export default Index;
