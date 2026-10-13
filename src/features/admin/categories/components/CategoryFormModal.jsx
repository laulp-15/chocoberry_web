// src/features/admin/categories/components/CategoryFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import './CategoryFormModal.css';

const renderIcon = (name) => {
  const iconStyle = { fontSize: '1.5rem', color: '#C2435A' };
  switch (name) {
    case 'Heart':
      return <i className="fa-solid fa-heart" style={iconStyle} aria-hidden="true" />;
    case 'User':
      return <i className="fa-solid fa-user" style={{ ...iconStyle, color: 'var(--texto)' }} aria-hidden="true" />;
    case 'Sparkles':
      return <i className="fa-solid fa-wand-magic-sparkles" style={{ ...iconStyle, color: '#F49B05' }} aria-hidden="true" />;
    case 'Cake':
      return <i className="fa-solid fa-cake-candles" style={iconStyle} aria-hidden="true" />;
    case 'Calendar':
      return <i className="fa-solid fa-calendar-days" style={iconStyle} aria-hidden="true" />;
    default:
      return <i className="fa-solid fa-gift" style={{ ...iconStyle, color: '#F49B05' }} aria-hidden="true" />;
  }
};

export default function CategoryFormModal({ isOpen, onClose, onSubmit, initialData, isReadOnly = false }) {
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('Activo');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setEstado(initialData.estado || 'Activo');
    } else {
      setNombre('');
      setEstado('Activo');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    onSubmit({ nombre, estado });
    onClose();
  };

  const title = isReadOnly ? 'Detalle de Categoría' : initialData ? 'Editar Categoría' : 'Crear Categoría';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        !isReadOnly ? (
          <>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" onClick={handleSubmit}>
              Guardar
            </button>
          </>
        ) : (
          <button type="button" className="btn-save" onClick={onClose}>
            Cerrar
          </button>
        )
      }
    >
      <div className="category-form-modal">
        {isReadOnly ? (
          <>
            <div className="category-detail-card">
              {renderIcon(initialData?.iconName)}
              <div>
                <h3 className="category-detail-name">{initialData?.nombre}</h3>
                <span className={`category-detail-status ${initialData?.estado === 'Activo' ? 'active' : 'inactive'}`}>
                  {initialData?.estado}
                </span>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Nombre"
              value={nombre}
              onChange={(v) => { setNombre(v); setErrors(prev => ({ ...prev, nombre: undefined })); }}
              placeholder="Ej: Día de la Madre"
              required
              error={errors.nombre}
            />
            <div className="form-field">
              <label className="form-label">Estado</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => setEstado(estado === 'Activo' ? 'Inactivo' : 'Activo')}
                  className={`status-toggle ${estado === 'Activo' ? 'active' : 'inactive'}`}
                  style={{ width: '46px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '2px', backgroundColor: estado === 'Activo' ? '#2E7D32' : '#E8D7DC', transition: 'background-color 0.2s ease' }}
                  title={estado === 'Activo' ? 'Desactivar' : 'Activar'}
                >
                  <div
                    className={`status-toggle-knob ${estado === 'Activo' ? 'active' : 'inactive'}`}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', position: 'absolute', left: estado === 'Activo' ? '24px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                  />
                </button>
                <span style={{ color: 'var(--texto)', fontSize: '0.9rem' }}>{estado}</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
