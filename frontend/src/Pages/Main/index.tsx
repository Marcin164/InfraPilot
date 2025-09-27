import React from "react";
import MainNavbar from "../../Components/Navbar/MainNavbar";
import Topbar from "../../Components/Topbar";
import { Outlet } from "react-router";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="flex">
      <MainNavbar />
      <div className="w-full bg-[#F6F6F6]">
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
};

export default index;
