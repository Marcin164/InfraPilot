import React, { useState } from "react";
import MainNavbar from "../../Components/Navbar/MainNavbar";
import Topbar from "../../Components/Topbar";
import { Outlet } from "react-router";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F6F6F6]">
      <MainNavbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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

export default MainLayout;
