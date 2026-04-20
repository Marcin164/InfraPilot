import React, { useEffect } from "react";
import SettingsNavbar from "../../../Components/Navbar/SettingsNavbar";
import { Outlet, useNavigate } from "react-router";
import PageMotion from "../../../Components/PageMotion/PageMotion";

type Props = {};

const index = (props: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("personal");
  }, []);

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
