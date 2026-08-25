import React, { useEffect, useState } from "react";
import MainNavbar from "../../Components/Navbar/MainNavbar";
import Topbar from "../../Components/Topbar";
import { Outlet } from "react-router";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <MainNavbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="lg:ml-[240px]">
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
