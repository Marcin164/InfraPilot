import React, { useState } from "react";
import { Outlet } from "react-router";
import UserNavbar from "./components/UserNavbar";
import Topbar from "../../Components/Topbar";

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <UserNavbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="lg:ml-[240px]">
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="h-[calc(100vh-58px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
