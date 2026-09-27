// src/shared/components/ThemeToggleBtn.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Ajusta la ruta de importación si es necesario

export default function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--secundario-3)',
        color: 'var(--texto)',
        border: '1px solid var(--borde)',
        padding: '8px 16px',
        borderRadius: '999px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '600',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease'
      }}
    >
      {isDark ? (
        <>
          {/* Icono de Sol (Cambiar a modo claro) */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF5360" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="3"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          LIGHT MODE
        </>
      ) : (
        <>
          {/* Icono de Luna (Cambiar a modo oscuro - Idéntico a tu captura) */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          DARK MODE
        </>
      )}
    </button>
  );
}