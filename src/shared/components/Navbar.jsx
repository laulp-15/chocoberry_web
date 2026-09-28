// src/shared/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/UseCart';
import { useAuth } from '../../features/login/hooks/useAuth';
import { useTheme } from '../context/ThemeContext'; // <--- 1. Importa tu hook de tema global
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.units, 0);

  const navLinks = [
    { to: "/", label: "Inicio", end: true },
    { to: "/conocenos", label: "Conócenos" },
    { to: "/productos", label: "Catálogo" },
    { to: "/reseñas", label: "Reseñas" },
  ];

  return (
    <nav
      className="navbar"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--borde)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img
            src={isDarkMode ? "/img/Logo/LogoDark_2.png" : "/img/Logo/LogoLight_2.png"}
            alt="ChocoBerry Logo"
          />
        </Link>

        {/* BOTÓN HAMBURGUESA (solo móvil) */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>

        {/* ENLACES DE NAVEGACIÓN */}
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ACCIONES (Derecha) */}
        <div className="navbar-actions">
          {/* BOTÓN MODO OSCURO / CLARO */}
          <button
            type="button"
            onClick={toggleTheme}
            className="navbar-theme-btn"
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <i
              className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"}
              style={{ color: isDarkMode ? '#FFB800' : 'var(--texto)' }}
            />
          </button>

          {/* Carrito */}
          <button
            type="button"
            onClick={() => navigate('/carrito')}
            className="navbar-cart-btn"
            title="Carrito de compras"
          >
            <i className="fa-solid fa-cart-shopping" />
            {cartCount > 0 && (
              <span className="navbar-cart-badge">
                {cartCount}
              </span>
            )}
          </button>

          {/* Cuenta o Login */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/users/listdomicilios')}
              className="navbar-account-btn"
            >
              <i className="fa-solid fa-user" />
              <span>Mi Cuenta</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="navbar-login-btn"
              title="Iniciar Sesión"
            >
              <i className="fa-solid fa-user" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}