import { Outlet } from "react-router";
import UserNavbar from "./components/UserNavbar";
import Topbar from "../../Components/Topbar";

const UserLayout = () => {
  return (
    <div className="flex">
      <UserNavbar />
      <div className="w-full bg-[#F6F6F6]">
        <Topbar />
        <div className="h-[calc(100vh-58px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
