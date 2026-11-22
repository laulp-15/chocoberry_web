// src/shared/components/AdminNavbar.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/login/hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { useTheme } from "../context/ThemeContext";
import "./AdminNavbar.css";

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function AdminNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { roleName } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === "dark";
  const themeLabel = isDark ? "Modo claro" : "Modo oscuro";

  // Nombre y rol provienen de la sesión (/auth/me -> BD), no del front.
  const fullName = user?.fullName?.trim() || "";
  const role = roleName?.trim() || "";

  const handleLogout = async (event) => {
    event.preventDefault();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <span className="admin-navbar-title">Panel administrativo</span>
      </div>

      <div className="admin-navbar-right">
        {/* 1. Perfil: avatar + nombre + rol */}
        <div className="admin-navbar-profile">
          <span className="admin-navbar-avatar" aria-hidden="true">
            <i className="fa-solid fa-circle-user" />
          </span>
          <span className="admin-navbar-profile-text">
            {fullName && <span className="admin-navbar-name">{fullName}</span>}
            {role && <span className="admin-navbar-role">{role}</span>}
          </span>
        </div>

        <span className="admin-navbar-divider" aria-hidden="true" />

        {/* 2. Cerrar sesión */}
        <button
          type="button"
          className="admin-navbar-btn admin-navbar-btn--logout"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          <span className="admin-navbar-btn-label">Cerrar sesión</span>
        </button>

        {/* 3. Cambio de modo */}
        <button
          type="button"
          className="admin-navbar-theme-btn"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}