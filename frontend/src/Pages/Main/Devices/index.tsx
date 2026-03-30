import React, { useEffect, useState } from "react";
import DevicesTable from "../../../Components/Tables/DevicesTable";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDevices, getFilter } from "../../../Services/devices";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonSecondary from "../../../Components/Buttons/ButtonSecondary";
import AddDeviceModal from "../../../Components/Modals/AddDeviceModal";

type Props = {};

const index = (props: Props) => {
  const navigate = useNavigate();
  const params = useParams();

  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({
    group: [],
    model: [],
    subgroup: [],
    state: [],
    location: [],
    manufacturer: [],
  });
  const [searchValue, setSearchValue] = useState("");
  const [addEQModal, setAddEQModal] = useState(false);
  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
  });

  const filterQuery = useQuery({
    queryKey: ["filter"],
    queryFn: () => getFilter(),
  });

  useEffect(() => {
    params.id && navigate(`/devices/${params.id}/systeminfo`);
  }, []);

  if (!devicesQuery?.data || devicesQuery?.data?.length <= 0) return null;

  const getSearchValue = (e: any) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  const toggleFilterOptions = (e: any) => {
    const targetValue: any = e.target.value;
    const targetName: any = e.target.name;
    const _filterOptions: any = { ...filterOptions };

    Object.entries(_filterOptions).map(([key, array]: any) => {
      const filterOption = array.find(
        (option: any) => option === e.target.value
      );

      if (key === targetName) {
        if (filterOption) {
          const index = array.indexOf(targetValue);

          if (index !== -1) {
            array.splice(index, 1);
          }
        } else {
          array.push(targetValue);
        }
      }
    });

    setFilterOptions(_filterOptions);
  };

  const toggleModal = () => {
    setAddEQModal((prev: any) => !prev);
  };

  return (
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="pt-4 pb-4 flex">
        <Filter
          filterData={filterQuery?.data}
          setFilters={toggleFilterOptions}
          filterOptions={filterOptions}
        />
        <Search onChange={getSearchValue} />
        <ButtonSecondary
          icon={faPlus}
          text="Add device"
          onClick={toggleModal}
        />
        <AddDeviceModal isModalOpen={addEQModal} onCloseModal={toggleModal} />
      </div>
      <DevicesTable
        data={devicesQuery?.data}
        filterOptions={filterOptions}
        searchValue={searchValue}
      />
    </div>
  );
};

export default index;
