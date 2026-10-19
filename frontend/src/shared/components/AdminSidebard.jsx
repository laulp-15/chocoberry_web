// src/shared/components/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/login/hooks/useAuth";
import "./AdminSidebar.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "fa-chart-line" },
  { to: "/admin/pedidos", label: "Pedidos", icon: "fa-box" },
  { to: "/admin/ventas", label: "Ventas", icon: "fa-credit-card" },
  { to: "/admin/entregas", label: "Entregas", icon: "fa-truck-fast" },
  { to: "/admin/productos", label: "Productos", icon: "fa-store" },
  { to: "/admin/categorias", label: "Categorías", icon: "fa-tag" },
  { to: "/admin/clientes", label: "Clientes", icon: "fa-user-group" },
  { to: "/admin/resenas", label: "Reseñas", icon: "fa-star" },
  { to: "/admin/usuarios", label: "Usuarios", icon: "fa-users" },
  { to: "/admin/roles", label: "Roles", icon: "fa-shield-halved" },
];

/**
 * @param {object} props
 * @param {boolean} props.open - visible en mobile (colapsado por defecto)
 * @param {() => void} props.onClose
 */
export default function AdminSidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Alerta de prueba para verificar si el botón responde al clic
    alert("¡Botón de cerrar sesión presionado con éxito!");

    logout();
    localStorage.removeItem("cb_session");
    sessionStorage.removeItem("cb_session");
    window.location.href = "/login";
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-sidebar-logo">ChocoBerry</div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <i className={`fa-solid ${item.icon}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sección inferior con eventos directos */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <i className="fa-solid fa-circle-user" />
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-username">
                {user?.fullName || "Leidy Figueroa"}
              </span>
              <span className="admin-sidebar-userrole">
                {user?.role === "administrador" ? "Administradora" : user?.role || "Usuario"}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            className="admin-sidebar-logout"
            onClick={handleLogout}
            style={{ cursor: "pointer", position: "relative", zIndex: 999 }}
          >
            <i className="fa-solid fa-right-to-bracket" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}