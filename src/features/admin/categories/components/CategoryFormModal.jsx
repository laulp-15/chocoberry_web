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
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
    } else {
      setNombre('');
      setDescripcion('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({ nombre, descripcion });
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
            <div>
              <label className="category-detail-label">DESCRIPCIÓN</label>
              <p className="category-detail-value">{initialData?.descripcion}</p>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Nombre"
              value={nombre}
              onChange={setNombre}
              placeholder="Ej: Día de la Madre"
              required
            />
            <FormTextField
              label="Descripción"
              value={descripcion}
              onChange={setDescripcion}
              placeholder="Descripción..."
              multiline
              minRows={3}
            />
          </form>
        )}
      </div>
    </Modal>
  );
}
