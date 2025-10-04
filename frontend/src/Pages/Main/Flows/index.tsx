import React from "react";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import FlowsTable from "../../../Components/Tables/FlowsTable";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="w-full px-4">
      <div className="pt-4 pb-4 flex">
        <Filter />
        <Search />
      </div>
      <FlowsTable />
    </div>
  );
};

export default index;
