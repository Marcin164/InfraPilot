import React from "react";
import SettingsNavbar from "../../../Components/Navbar/SettingsNavbar";
import { Outlet } from "react-router";
import PageMotion from "../../../Components/PageMotion/PageMotion";

type Props = {};

const index = (props: Props) => {
  return (
    <PageMotion>
    <div className="w-full p-4">
      <SettingsNavbar />
      <div className="py-4 w-full">
        <Outlet />
      </div>
    </div>
    </PageMotion>
  );
};

export default index;
