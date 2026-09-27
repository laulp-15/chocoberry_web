// src/shared/components/Navbar.jsx
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/UseCart';
import { useAuth } from '../../features/login/hooks/useAuth';
import { useTheme } from '../context/ThemeContext'; // <--- 1. Importa tu hook de tema global
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  
  // 2. Extraemos el tema actual y la función toggleTheme del contexto global
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const cartCount = items.reduce((sum, item) => sum + item.units, 0);

  return (
    <nav
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
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.8rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src={isDarkMode ? "/img/Logo/LogoDark_2.png" : "/img/Logo/LogoLight_2.png"}
            alt="ChocoBerry Logo"
            style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
            }}
          />
        </Link>

        {/* ENLACES DE NAVEGACIÓN */}
        <ul
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'var(--texto)', fontWeight: '600', fontSize: '0.95rem' }}>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/conocenos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'var(--texto)', fontWeight: '600', fontSize: '0.95rem' }}>
              Conócenos
            </NavLink>
          </li>
          <li>
            <NavLink to="/productos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'var(--texto)', fontWeight: '600', fontSize: '0.95rem' }}>
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink to="/reseñas" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'var(--texto)', fontWeight: '600', fontSize: '0.95rem' }}>
              Reseñas
            </NavLink>
          </li>
        </ul>

        {/* ACCIONES (Derecha) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          
          {/* BOTÓN MODO OSCURO / CLARO */}
          <button
            type="button"
            onClick={toggleTheme} // <--- 3. Ejecuta la función global que cambia el data-theme
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--texto)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
            }}
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <i 
              className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} 
              style={{ fontSize: '1.15rem', color: isDarkMode ? '#FFB800' : 'var(--texto)' }} 
            />
          </button>

          {/* Carrito */}
          <button
            type="button"
            onClick={() => navigate('/carrito')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto)', position: 'relative' }}
            title="Carrito de compras"
          >
            <i className="fa-solid fa-cart-shopping" style={{ fontSize: '1.25rem' }} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: 'var(--primario, #E63950)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  borderRadius: '999px',
                  padding: '0 4px',
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Cuenta o Login */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => navigate('/users/listdomicilios')}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--borde)',
                  cursor: 'pointer',
                  color: 'var(--texto)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                }}
              >
                <i className="fa-solid fa-user" style={{ fontSize: '1rem', color: 'var(--primario, #E63950)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Mi Cuenta</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto)' }}
              title="Iniciar Sesión"
            >
              <i className="fa-solid fa-user" style={{ fontSize: '1.25rem' }} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}