import React from 'react';

const styles = {
  card: {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  text: {
    color: '#666',
    margin: 0,
  },
};

export default function UserTransactions() {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Mis Transacciones</h2>
      <p style={styles.text}>Aquí podrás ver el historial de tus pagos y facturas.</p>
    </div>
  );
}