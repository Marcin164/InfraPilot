import React from "react";
import ReportsNavbar from "../../../Components/Navbar/ReportsNavbar";
import { Outlet } from "react-router";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="w-full p-4">
      <ReportsNavbar />
      <div className="py-4 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default index;
