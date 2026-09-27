// src/features/profile/components/UserOrders.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const UserOrders = () => {
  const { theme } = useOutletContext();
  const isDark = theme === 'dark';

  const [orders] = useState([
    { id: '1024', date: '15 Sep 2026', total: '$85.000', status: 'Entregado', items: 'Caja Romance (Fresas con Chocolate)' },
    { id: '1019', date: '02 Sep 2026', total: '$45.000', status: 'En camino', items: 'Ramo Dulce Mamá' },
    { id: '1005', date: '20 Ago 2026', total: '$95.000', status: 'Entregado', items: 'Set Fuerza Papá' }
  ]);

  // Colores dinámicos según el modo
  const colors = {
    title: '#d90429',
    border: isDark ? '#3d2c30' : '#fde2e4',
    emptyText: isDark ? '#b8a3a7' : '#888',
    cardBg: isDark ? '#23161a' : '#fff5f6',
    cardBorder: isDark ? '#3d2c30' : '#fde2e4',
    textMain: isDark ? '#f7f1f2' : '#4a4a4a',
    textTotal: isDark ? '#f7f1f2' : '#2b2d42',
    textDate: isDark ? '#b8a3a7' : '#8c7a6b',
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', color: colors.title, marginBottom: '20px', borderBottom: `2px solid ${colors.border}`, paddingBottom: '10px', fontWeight: '700' }}>Mis Pedidos</h2>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.emptyText, marginTop: '40px', fontSize: '16px' }}>NO HAY DOMICILIOS</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', background: colors.cardBg, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
              <div>
                <strong style={{ color: '#d90429', fontSize: '16px' }}>Pedido #{order.id}</strong>
                <p style={{ margin: '4px 0 2px', fontSize: '14px', color: colors.textMain, fontWeight: '600' }}>{order.items}</p>
                <span style={{ fontSize: '13px', color: colors.textDate }}>Fecha: {order.date}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontWeight: 'bold', color: colors.textTotal, fontSize: '16px', marginBottom: '6px' }}>{order.total}</span>
                <span style={{ 
                  fontSize: '12px', 
                  background: order.status === 'Entregado' ? (isDark ? '#1a3a2a' : '#d8f3dc') : (isDark ? '#3a2a1a' : '#ffe8d6'), 
                  color: order.status === 'Entregado' ? (isDark ? '#52b788' : '#2d6a4f') : (isDark ? '#f4a261' : '#bc6c25'), 
                  padding: '5px 12px', 
                  borderRadius: '20px', 
                  display: 'inline-block',
                  fontWeight: '600'
                }}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;