import React, { useEffect } from "react";
import DevicesTable from "../../../Components/Tables/DevicesTable";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useNavigate, useParams } from "react-router";

type Props = {};

const index = (props: Props) => {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    params.id && navigate(`/devices/${params.id}/systeminfo`);
  }, []);

  return (
    <div className="w-full px-4">
      <div className="pt-4 pb-8 flex">
        <Filter />
        <Search />
      </div>
      <DevicesTable />
    </div>
  );
};

export default index;
