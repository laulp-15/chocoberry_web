// src/shared/components/AdminSidebar.jsx
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import { usePermissions } from "../hooks/usePermissions";
import { allowedNavItems } from "../permissions/panelPermissions";
import { useTheme } from "../context/ThemeContext";
import SidebarTooltip from "./SidebarTooltip";
import "./AdminSidebar.css";

const STORAGE_KEY = "cb_sidebar_collapsed";

export default function AdminSidebar({ open = false, onClose }) {
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const { permissions } = usePermissions();
  const { theme } = useTheme();
  const location = useLocation();
  const isDarkMode = theme === "dark";
  const navItems = allowedNavItems(permissions);

  const isDesktop = useMediaQuery("(min-width:992px)");
  const isCollapsed = collapsed && isDesktop;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Almacenamiento no disponible: el estado sigue solo en memoria.
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

  const tip = (label) => (isCollapsed ? label : "");

  return (
    <>
      {open && !isDesktop && (
        <div className="admin-sidebar-backdrop" onClick={onClose} />
      )}

      <aside
        className={`admin-sidebar ${open ? "open" : ""} ${
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
          {navItems.map((item) =>
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
                        onClick={onClose}
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
                    onClick={onClose}
                  >
                    <i className={`fa-solid ${item.icon}`} />
                    <span className="admin-nav-label">{item.label}</span>
                  </NavLink>
                </div>
              </SidebarTooltip>
            )
          )}
        </nav>
      </aside>
    </>
  );
}
