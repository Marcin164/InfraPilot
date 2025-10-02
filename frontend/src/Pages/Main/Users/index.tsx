import UsersTable from "../../../Components/Tables/UsersTable";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import { useQuery } from "@tanstack/react-query";
import { getFilter, getUsersTable } from "../../../Services/users";
import { useState } from "react";

const index = () => {
  const [filterOptions, setFilterOptions] = useState({
    department: [],
    company: [],
    office: [],
    city: [],
    country: [],
    title: [],
    streetAddress: [],
    postalCode: [],
    manager: [],
  });
  const [searchValue, setSearchValue] = useState("");

  const userQuery = useQuery({ queryKey: ["users"], queryFn: getUsersTable });
  const filterQuery = useQuery({ queryKey: ["filter"], queryFn: getFilter });

  if (!userQuery?.data && userQuery?.data?.length <= 0) return null;

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
      <div className="pt-4 pb-8 flex">
        <Filter
          filterData={filterQuery?.data}
          setFilters={toggleFilterOptions}
          filterOptions={filterOptions}
        />
        <Search onChange={getSearchValue} />
      </div>
      <UsersTable
        data={userQuery?.data}
        filterOptions={filterOptions}
        searchValue={searchValue}
      />
    </div>
  );
};

export default index;
