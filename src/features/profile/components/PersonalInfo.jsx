// src/features/profile/components/PersonalInfo.jsx
import React, { useState } from 'react';
import useAuthTheme from '../../login/hooks/useAuthTheme'; // Ajusta la ruta de tu hook de tema

const PersonalInfo = () => {
  const { theme } = useAuthTheme();
  const isDark = theme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'Mari',
    email: 'mari@chocoberry.com',
    phone: '+57 3146494472',
  });

  // Paleta de colores para este componente
  const colors = {
    primary: '#d90429',
    text: isDark ? '#f7f1f2' : '#4a4a4a',
    textMuted: isDark ? '#b8a3a7' : '#6c757d',
    cardBg: isDark ? '#23161a' : '#fff5f6',
    borderSubtle: isDark ? '#3d2c30' : '#fde2e4',
    inputBg: isDark ? '#181013' : '#ffffff',
    inputText: isDark ? '#f7f1f2' : '#2d1e21',
    inputBorder: isDark ? '#4a3238' : '#f6bd60',
  };

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div>
      <h2 style={{ 
        fontSize: '24px', 
        color: colors.primary, 
        marginBottom: '20px', 
        borderBottom: `2px solid ${colors.borderSubtle}`, 
        paddingBottom: '10px', 
        fontWeight: '700' 
      }}>
        Información Personal
      </h2>
      
      {!isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: colors.text, fontSize: '16px' }}>
          <div style={{ padding: '15px', background: colors.cardBg, borderRadius: '10px', transition: 'background 0.3s ease' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Nombre:</strong> {userInfo.name}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Correo electrónico:</strong> {userInfo.email}</p>
            <p style={{ margin: 0 }}><strong>Teléfono:</strong> {userInfo.phone}</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              padding: '12px 24px',
              background: '#e63946',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              width: 'fit-content',
              boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)',
              transition: 'background 0.2s'
            }}
          >
             Editar Información
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '450px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: colors.textMuted, fontWeight: '600' }}>
            Nombre:
            <input 
              type="text" 
              name="name" 
              value={userInfo.name} 
              onChange={handleChange} 
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: `1px solid ${colors.inputBorder}`, 
                outline: 'none', 
                fontSize: '15px',
                backgroundColor: colors.inputBg,
                color: colors.inputText
              }} 
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: colors.textMuted, fontWeight: '600' }}>
            Correo electrónico:
            <input 
              type="email" 
              name="email" 
              value={userInfo.email} 
              onChange={handleChange} 
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: `1px solid ${colors.inputBorder}`, 
                outline: 'none', 
                fontSize: '15px',
                backgroundColor: colors.inputBg,
                color: colors.inputText
              }} 
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: colors.textMuted, fontWeight: '600' }}>
            Teléfono:
            <input 
              type="text" 
              name="phone" 
              value={userInfo.phone} 
              onChange={handleChange} 
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: `1px solid ${colors.inputBorder}`, 
                outline: 'none', 
                fontSize: '15px',
                backgroundColor: colors.inputBg,
                color: colors.inputText
              }} 
            />
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" style={{ padding: '12px 24px', background: '#2a9d8f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(42, 157, 143, 0.3)' }}> Guardar</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', background: '#adb5bd', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PersonalInfo;