// src/features/admin/frostings/components/FrostingFormModal.jsx
import React, { useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import StatusToggle from '../../../../shared/components/StatusToggle';
import useFormValidation from '../../../../shared/hooks/useFormValidation';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export default function FrostingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
}) {
  const { values, errors, setField, handleBlur, validateAll, reset } = useFormValidation({
    initialValues: { nombre: '', hex: '', estado: 'Activo' },
    validators: {
      nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
      hex: (v) => (HEX_PATTERN.test(v.hex.trim()) ? '' : 'Usa un color hexadecimal válido (ej: #EF818A).'),
    },
    immediate: ['estado'],
  });

  useEffect(() => {
    reset({
      nombre: initialData?.nombre || '',
      hex: initialData?.hex || '',
      estado: initialData?.estado || 'Activo',
    });
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    onSubmit({
      nombre: values.nombre.trim(),
      hex: values.hex.trim().toUpperCase(),
      estado: values.estado,
    });
    onClose();
  };

  const isHexValid = HEX_PATTERN.test(values.hex.trim());
  const swatchColor = isHexValid ? values.hex.trim() : 'transparent';

  const title = isReadOnly
    ? 'Detalle de Glaseado'
    : initialData
      ? 'Editar Glaseado'
      : 'Crear Glaseado';

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
      <div className="crud-form-modal">
        {isReadOnly ? (
          <div className="crud-detail-card">
            <div className="crud-detail-header">
              <span className="crud-color-cell">
                <span className="crud-swatch" style={{ backgroundColor: initialData?.hex }} />
                <h3 className="crud-detail-name">{initialData?.nombre}</h3>
              </span>
              <span
                className={`crud-detail-status ${
                  initialData?.estado === 'Activo' ? 'active' : 'inactive'
                }`}
              >
                {initialData?.estado}
              </span>
            </div>

            <div className="crud-detail-list">
              <div className="crud-detail-row">
                <span className="crud-detail-label">Código hexadecimal</span>
                <span className="crud-detail-value">{initialData?.hex || '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Nombre"
              value={values.nombre}
              onChange={(v) => setField('nombre', v)}
              onBlur={() => handleBlur('nombre')}
              placeholder="Ej: Rosa"
              required
              error={errors.nombre}
            />

            <FormTextField
              label="Color"
              value={values.hex}
              onChange={(v) => setField('hex', v.toUpperCase())}
              onBlur={() => handleBlur('hex')}
              placeholder="#EF818A"
              required
              error={errors.hex}
              endAdornment={
                <input
                  type="color"
                  className="crud-color-input"
                  value={isHexValid ? values.hex.trim() : '#000000'}
                  onChange={(e) => setField('hex', e.target.value.toUpperCase())}
                  title="Elegir color"
                  aria-label="Elegir color"
                />
              }
            />

            <div className="form-field">
              <div className="crud-color-cell">
                <span className="crud-swatch" style={{ backgroundColor: swatchColor }} />
                <span className="crud-status-label">
                  {values.nombre.trim() || 'Vista previa'}
                </span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Estado</label>
              <div className="crud-status-field">
                <StatusToggle
                  checked={values.estado === 'Activo'}
                  onChange={(checked) => setField('estado', checked ? 'Activo' : 'Inactivo')}
                />
                <span className="crud-status-label">{values.estado}</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
