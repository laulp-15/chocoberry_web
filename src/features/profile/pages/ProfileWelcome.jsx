// src/features/profile/pages/ProfileWelcome.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';

const ProfileWelcome = () => {
  const { theme } = useOutletContext();
  const isDark = theme === 'dark';

  const colors = {
    title: '#d90429',
    text: isDark ? '#b8a3a7' : '#6c757d',
    boxBg: isDark ? '#23161a' : '#fff5f6',
    boxBorder: isDark ? '#5c3a3e' : '#f6bd60',
    boxText: isDark ? '#f7f1f2' : '#b5838d',
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h1 style={{ color: colors.title, fontSize: '28px', marginBottom: '15px', fontWeight: '800' }}>¡Bienvenida de nuevo, MARI! </h1>
      <p style={{ color: colors.text, lineHeight: '1.7', fontSize: '16px', transition: 'color 0.3s ease' }}>
        Nos alegra muchísimo tenerte de vuelta en <strong>Chocoberry</strong>. Desde este panel puedes gestionar tus datos personales con facilidad y revisar el estado de tus deliciosos regalos de fresas con chocolate.
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: colors.boxBg, borderRadius: '12px', border: `1px dashed ${colors.boxBorder}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}>
        <p style={{ margin: 0, color: colors.boxText, fontSize: '15px', fontWeight: '500' }}> Consejo: Recuerda mantener tu número de teléfono y correo actualizados para que tus sorpresas lleguen siempre a tiempo.</p>
      </div>
    </div>
  );
};

export default ProfileWelcome;