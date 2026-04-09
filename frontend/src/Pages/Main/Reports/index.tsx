import React, { useEffect } from "react";
import ReportsNavbar from "../../../Components/Navbar/ReportsNavbar";
import { Outlet, useNavigate } from "react-router";

type Props = {};

const index = (props: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("users");
  }, []);
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
