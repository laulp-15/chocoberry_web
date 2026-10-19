// src/shared/layouts/AdminLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { IconButton } from "@mui/material";
import { useAuth } from "../../features/login/hooks/useAuth";
import { useTheme } from "../../shared/context/ThemeContext";
import ThemeToggleBtn from "../components/ThemeToggleBtn"; // <- 1. Importamos el botón del Sol y Luna
import "./AdminLayout.css";

// Menú del admin sin el módulo de clientes
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "fa-chart-line", end: true },
  { to: "/admin/roles", label: "Roles", icon: "fa-shield-halved" },
  { to: "/admin/usuarios", label: "Usuarios", icon: "fa-users" },
  { to: "/admin/categorias", label: "Categorías", icon: "fa-tag" },
  { to: "/admin/productos", label: "Productos", icon: "fa-store" },
  { to: "/admin/pedidos", label: "Pedidos", icon: "fa-box" },
  { to: "/admin/ventas", label: "Ventas", icon: "fa-credit-card" },
  { to: "/admin/resenas", label: "Reseñas", icon: "fa-star" },
  {
    label: "Configuraciones",
    icon: "fa-sliders",
    children: [
      { to: "/admin/presentaciones", label: "Presentaciones", icon: "fa-layer-group" },
      { to: "/admin/municipios", label: "Municipios", icon: "fa-location-dot" },
      { to: "/admin/glaseados", label: "Glaseados", icon: "fa-palette" },
    ],
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const isDarkMode = theme === "dark";

  // ¿La ruta actual pertenece a un grupo desplegable? Si sí, se mantiene abierto.
  const isGroupRoute = (group) =>
    group.children.some((child) => location.pathname.startsWith(child.to));

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    localStorage.removeItem("cb_session");
    sessionStorage.removeItem("cb_session");
    window.location.href = "/login";
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <img
            src={isDarkMode ? "/img/Logo/LogoDark_1.png" : "/img/Logo/CHOCOBERRY.png"}
            alt="ChocoBerry"
            className="admin-brand-logo"
          />
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div className="admin-nav-group" key={item.label}>
                <button
                  type="button"
                  className={`admin-nav-item admin-nav-parent ${
                    isGroupRoute(item) ? "admin-nav-parent--active" : ""
                  }`}
                  onClick={() => setIsGroupOpen((prev) => !prev)}
                  aria-expanded={isGroupOpen || isGroupRoute(item)}
                >
                  <i className={`fa-solid ${item.icon}`} />
                  <span className="admin-nav-parent-label">{item.label}</span>
                  <i
                    className={`fa-solid fa-chevron-down admin-nav-chevron ${
                      isGroupOpen || isGroupRoute(item) ? "open" : ""
                    }`}
                  />
                </button>

                {(isGroupOpen || isGroupRoute(item)) && (
                  <div className="admin-nav-children">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `admin-nav-item admin-nav-child ${isActive ? "active" : ""}`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <i className={`fa-solid ${child.icon}`} />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`fa-solid ${item.icon}`} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <i className="fa-solid fa-circle-user" />
            <div className="admin-profile-info">
              <span className="admin-profile-name">
                {user?.email === "admin@chocoberry.com" ? "Leidy Figueroa" : user?.fullName || user?.name || "Leidy Figueroa"}
              </span>
              <span className="admin-profile-role">
                Administradora
              </span>
            </div>
          </div>
          <div className="admin-sidebar-actions">
            <ThemeToggleBtn />
            <button 
              type="button" 
              className="admin-sidebar-action-btn"
              onClick={handleLogout}
            >
              <i className="fa-solid fa-right-to-bracket" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-content">
        {/* Barra superior con espacio entre el menú hamburguesa y el botón Dark/Light Mode */}
        <header className="admin-topbar">
          <IconButton
            className="admin-menu-toggle"
            disableRipple
            onClick={() => setSidebarOpen(true)}
          >
            <i className="fa-solid fa-bars" />
          </IconButton>
        </header>

        <main className="admin-main">
          {/* Aquí se monta la página de cada módulo */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}