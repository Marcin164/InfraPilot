import React from "react";
import SettingsNavbar from "../../../Components/Navbar/SettingsNavbar";
import { Outlet } from "react-router";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="w-full p-4">
      <SettingsNavbar />
      <div className="py-4 w-full">
        <Outlet />
      </div>
      {/* <Personal />
      <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 m-4">
        <CardHeader text="General" />
        <div className="pt-2 pb-4 text-[#3C3C3C] font-semibold">
          Active Directory
        </div>
        <div>
          <ButtonPrimary
            text="Connect to active directory"
            onClick={() => {}}
          />
        </div>
      </div> */}
    </div>
  );
};

export default index;
