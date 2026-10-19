// src/features/profile/components/UserAddresses.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function UserAddresses() {
  const { theme } = useOutletContext();
  const isDark = theme === 'dark';

  const colors = {
    cardBg: isDark ? '#23161a' : '#fff5f6',
    border: isDark ? '#3d2c30' : '#fde2e4',
    title: '#d90429',
    text: isDark ? '#f7f1f2' : '#4a4a4a',
  };

  const styles = {
    card: {
      background: colors.cardBg,
      padding: '25px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      transition: 'background 0.3s ease, border-color 0.3s ease'
    },
    title: {
      fontSize: '24px',
      color: colors.title,
      marginBottom: '15px',
      borderBottom: `2px solid ${colors.border}`,
      paddingBottom: '10px',
      fontWeight: '700'
    },
    text: {
      fontSize: '16px',
      color: colors.text,
      marginBottom: '20px'
    },
    button: {
      padding: '12px 24px',
      background: '#e63946',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)'
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Mis Direcciones Guardadas</h2>
      <p style={styles.text}>No tienes direcciones registradas actualmente.</p>
      <button style={styles.button}>Agregar nueva dirección</button>
    </div>
  );
}