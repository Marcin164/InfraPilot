import React from "react";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import ApplicationsTable from "../../../Components/Tables/ApplicationsTable";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="w-full px-4">
      <div className="pt-4 pb-8 flex">
        <Filter />
        <Search />
      </div>
      <ApplicationsTable />
    </div>
  );
};

export default index;
