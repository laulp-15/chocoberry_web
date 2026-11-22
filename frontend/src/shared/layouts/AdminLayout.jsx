// src/shared/layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="admin-content">
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="admin-main">
          {/* Aquí se monta la página de cada módulo */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
