import React, { useState } from "react";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import ApplicationsTable from "../../../Components/Tables/ApplicationsTable";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import {
  getApplicationsTable,
  getFilter,
} from "../../../Services/applications";

type Props = {};

const index = (props: Props) => {
  const [filterOptions, setFilterOptions] = useState({
    publisher: [],
  });
  const [searchValue, setSearchValue] = useState("");

  const authInfo = useAuthInfo();

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => getApplicationsTable(authInfo.accessToken),
  });
  const filterQuery = useQuery({
    queryKey: ["filter"],
    queryFn: () => getFilter(authInfo.accessToken),
  });

  if (!applicationsQuery?.data && applicationsQuery?.data?.length <= 0)
    return null;

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

  return (
    <div className="w-full px-4">
      <div className="pt-4 pb-4 flex">
        <Filter
          filterData={filterQuery?.data}
          setFilters={toggleFilterOptions}
          filterOptions={filterOptions}
        />
        <Search onChange={getSearchValue} />
      </div>
      <ApplicationsTable
        data={applicationsQuery?.data}
        filterOptions={filterOptions}
        searchValue={searchValue}
      />
    </div>
  );
};

export default index;
