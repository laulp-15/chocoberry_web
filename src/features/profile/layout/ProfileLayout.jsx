// src/features/profile/layout/ProfileLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../login/hooks/useAuth';
import useAuthTheme from '../../login/hooks/useAuthTheme';
import './ProfileLayout.css';

const ProfileLayout = () => {
  const { logout } = useAuth();
  const { theme } = useAuthTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const colors = {
    pageBg: isDark ? '#181013' : '#fffafb',
    mainBg: isDark ? '#1a1215' : '#ffffff',
    mainText: isDark ? '#f7f1f2' : '#4a4a4a',
    primary: '#d90429',
    sidebarBg: isDark ? '#1a1215' : '#ffffff',
    sidebarText: '#4a4a4a',
    sidebarBorder: '#fce8eb',
    sidebarSubtle: '#fde2e4',
    sidebarHover: '#fff5f6',
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '0 20px',
      gap: '30px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      backgroundColor: colors.pageBg,
      minHeight: '80vh',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Menú Lateral Fijo en Modo Claro */}
      <aside className="profile-sidebar" style={{ background: colors.sidebarBg }}>
        <h3 className="profile-sidebar-title">
          Mi Cuenta Chocoberry
        </h3>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <NavLink to="/users/listdomicilios" className={({ isActive }) => `profile-nav-link${isActive ? ' active' : ''}`}>
                Bienvenida
              </NavLink>
            </li>
            <li>
              <NavLink to="/users/informacion-personal" className={({ isActive }) => `profile-nav-link${isActive ? ' active' : ''}`}>
                Información Personal
              </NavLink>
            </li>
            <li>
              <NavLink to="/users/orders" className={({ isActive }) => `profile-nav-link${isActive ? ' active' : ''}`}>
                Mis Pedidos
              </NavLink>
            </li>
            <li className="profile-nav-divider">
              <button 
                onClick={handleLogout}
                className="profile-logout-btn"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Cuadro Grande Central Dinámico */}
      <main style={{
        flex: 1,
        background: colors.mainBg,
        borderRadius: '16px',
        boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.5)' : '0 8px 30px rgba(230, 57, 70, 0.08)',
        padding: '35px',
        border: isDark ? '1px solid #2d1e22' : `1px solid ${colors.sidebarBorder}`,
        color: colors.mainText,
        transition: 'background 0.3s ease, color 0.3s ease, border-color 0.3s ease'
      }}>
        {/* AQUÍ ESTÁ EL TRUCO: Pasamos { theme } a través del context */}
        <Outlet context={{ theme }} />
      </main>
    </div>
  );
};

export default ProfileLayout;