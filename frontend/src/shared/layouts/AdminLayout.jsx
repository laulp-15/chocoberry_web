// src/shared/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { IconButton, useMediaQuery } from "@mui/material";
import { useAuth } from "../../features/login/hooks/useAuth";
import { useTheme } from "../../shared/context/ThemeContext";
import SidebarTooltip from "../components/SidebarTooltip";
import ThemeToggleBtn from "../components/ThemeToggleBtn";
import "./AdminLayout.css";

// Menú del admin
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

const STORAGE_KEY = "cb_sidebar_collapsed";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const isDarkMode = theme === "dark";

  const isDesktop = useMediaQuery("(min-width:992px)");
  const isCollapsed = collapsed && isDesktop;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
    }
  }, [collapsed]);

  const isGroupRoute = (group) =>
    group.children.some((child) => location.pathname.startsWith(child.to));

  const handleParentClick = () => {
    if (isCollapsed) {
      setCollapsed(false);
      setIsGroupOpen(true);
    } else {
      setIsGroupOpen((prev) => !prev);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    localStorage.removeItem("cb_session");
    sessionStorage.removeItem("cb_session");
    window.location.href = "/login";
  };

  const tip = (label) => (isCollapsed ? label : "");

  return (
    <div className="admin-layout">
      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""} ${
          isCollapsed ? "collapsed" : ""
        }`}
      >
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!isCollapsed}
        >
          <i className="fa-solid fa-angles-left" />
        </button>

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
                <SidebarTooltip title={tip(item.label)}>
                  <button
                    type="button"
                    className={`admin-nav-item admin-nav-parent ${
                      isGroupRoute(item) ? "admin-nav-parent--active" : ""
                    }`}
                    onClick={handleParentClick}
                    aria-expanded={!isCollapsed && (isGroupOpen || isGroupRoute(item))}
                  >
                    <i className={`fa-solid ${item.icon}`} />
                    <span className="admin-nav-label admin-nav-parent-label">
                      {item.label}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down admin-nav-chevron ${
                        isGroupOpen || isGroupRoute(item) ? "open" : ""
                      }`}
                    />
                  </button>
                </SidebarTooltip>

                {!isCollapsed && (isGroupOpen || isGroupRoute(item)) && (
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
                        <span className="admin-nav-label">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              
              <SidebarTooltip key={item.to} title={tip(item.label)}>
                <div>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? "active" : ""}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`fa-solid ${item.icon}`} />
                    <span className="admin-nav-label">{item.label}</span>
                  </NavLink>
                </div>
              </SidebarTooltip>
            )
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <i className="fa-solid fa-circle-user" />
            <div className="admin-profile-info">
              <span className="admin-profile-name">
                {user?.email === "admin@chocoberry.com"
                  ? "Leidy Figueroa"
                  : user?.fullName || user?.name || "Leidy Figueroa"}
              </span>
              <span className="admin-profile-role">Administradora</span>
            </div>
          </div>
          <div className="admin-sidebar-actions">
            <ThemeToggleBtn collapsed={isCollapsed} />
            <SidebarTooltip title={tip("Cerrar sesión")}>
              <button
                type="button"
                className="admin-sidebar-action-btn"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-to-bracket" />
                <span className="admin-nav-label">Cerrar sesión</span>
              </button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-content">
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