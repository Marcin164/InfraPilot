import React, { useState } from "react";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useTranslation } from "react-i18next";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import TableSettings from "../../../Components/TableSettings";

type Props = {};

const index = (props: Props) => {
  const authInfo = useAuthInfo();
  const { t } = useTranslation();
  const [filterOptions, setFilterOptions] = useState({});
  const [searchValue, setSearchValue] = useState("");

  const helpdeskQuery = useQuery({
    queryKey: ["helpdesk"],
    // queryFn: () => getUsersTable(authInfo.accessToken),
  });

  const filterQuery = useQuery({
    queryKey: ["filter"],
    // queryFn: () => getFilter(authInfo.accessToken),
  });

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
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="pt-4 pb-4 flex">
        <Filter
          filterData={filterQuery?.data}
          setFilters={toggleFilterOptions}
          filterOptions={filterOptions}
        />
        <Search onChange={getSearchValue} />
        <TableSettings />
      </div>
    </div>
  );
};

export default index;
