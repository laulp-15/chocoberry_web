// src/shared/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/UseCart';
import { useAuth } from '../../features/login/hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useTheme } from '../context/ThemeContext';
import PoliciesMenu from './PoliciesMenu';
import { POLICY_DOCS } from '../utils/policyDocs';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  return <NavbarContent key={pathname} />;
}

function NavbarContent() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  const { canEnterPanel, firstAllowedPath } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const navRef = useRef(null);

  const cartCount = items.reduce((sum, item) => sum + item.units, 0);
  const accountPath =
    isAuthenticated && canEnterPanel
      ? firstAllowedPath || '/admin'
      : '/users/orders';

  const navLinks = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/conocenos', label: 'Conócenos' },
    { to: '/productos', label: 'Catálogo' },
    { to: '/reseñas', label: 'Reseñas' },
  ];

  const closeMenu = () => {
    setMenuOpen(false);
    setPoliciesOpen(false);
  };

  const toggleMenu = () => {
    if (menuOpen) setPoliciesOpen(false);
    setMenuOpen((prev) => !prev);
  };

  // Cierra con Escape, al tocar fuera del navbar y al pasar a escritorio
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setPoliciesOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
        setPoliciesOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 991) {
        setMenuOpen(false);
        setPoliciesOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className="navbar"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--borde)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img
            src={isDarkMode ? '/img/Logo/LogoDark_2.png' : '/img/Logo/LogoLight_2.png'}
            alt="ChocoBerry Logo"
          />
        </Link>

        {/* ENLACES DE NAVEGACIÓN */}
        <ul
          id="navbar-menu"
          className={`navbar-links ${menuOpen ? 'open' : ''}`}
        >
          {navLinks.map((link, index) => (
            <li key={link.to} style={{ '--i': index }}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            </li>
          ))}

          {/* Políticas en escritorio */}
          <li className="navbar-policies-desktop">
            <PoliciesMenu />
          </li>

          {/* Políticas en móvil: submenú dentro del menú hamburguesa */}
          <li className="navbar-policy-mobile" style={{ '--i': navLinks.length }}>
            <button
              type="button"
              className="navbar-policy-toggle"
              onClick={() => setPoliciesOpen((prev) => !prev)}
              aria-expanded={policiesOpen}
              aria-controls="navbar-policies-mobile"
            >
              Políticas
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>
            <ul
              id="navbar-policies-mobile"
              className={`navbar-policy-sublist${policiesOpen ? ' open' : ''}`}
            >
              {POLICY_DOCS.map((doc) => (
                <li key={doc.id}>
                  <a
                    className="nav-link"
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>

        {/* ACCIONES (Derecha) */}
        <div className="navbar-actions">
          {/* BOTÓN MODO OSCURO / CLARO */}
          <button
            type="button"
            onClick={toggleTheme}
            className="navbar-theme-btn"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <i className={isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
          </button>

          {/* Carrito */}
          <button
            type="button"
            onClick={() => navigate('/carrito')}
            className="navbar-cart-btn"
            title="Carrito de compras"
            aria-label="Carrito de compras"
          >
            <i className="fa-solid fa-cart-shopping" />
            {cartCount > 0 && (
              <span className="navbar-cart-badge">{cartCount}</span>
            )}
          </button>

          {/* Cuenta o Login */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate(accountPath)}
              className="navbar-account-btn"
              aria-label="Mi cuenta"
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
              aria-label="Iniciar sesión"
            >
              <i className="fa-solid fa-user" />
            </button>
          )}
        </div>

        {/* BOTÓN HAMBURGUESA (solo móvil/tablet) */}
        <button
          type="button"
          className={`navbar-hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
        >
          <i className="fa-solid fa-bars icon-bars" />
          <i className="fa-solid fa-xmark icon-close" />
        </button>
      </div>
    </nav>
  );
}