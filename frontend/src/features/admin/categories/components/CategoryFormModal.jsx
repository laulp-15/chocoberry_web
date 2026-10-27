// src/features/admin/categories/components/CategoryFormModal.jsx
import { useEffect, useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import useFormValidation from '../../../../shared/hooks/useFormValidation';
import './CategoryFormModal.css';

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
  submitting = false,
}) {
  const [formError, setFormError] = useState('');

  const { values, errors, setField, handleBlur, setFieldError, validateAll, reset } =
    useFormValidation({
      initialValues: { nombre: '', estado: 'Activo' },
      validators: {
        nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
      },
      immediate: ['estado'],
    });

  useEffect(() => {
    if (!isOpen) return;

    reset({
      nombre: initialData?.nombre || '',
      estado: initialData?.estado || 'Activo',
    });
  }, [initialData, isOpen]);

  const handleClose = () => {
    setFormError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateAll()) return;

    try {
      await onSubmit({ nombre: values.nombre.trim(), estado: values.estado });
      handleClose();
    } catch (err) {
      if (err?.code === 'NAME_TAKEN') {
        setFieldError('nombre', err.message);
      } else {
        setFormError(err?.message || 'No fue posible guardar la categoría.');
      }
    }
  };

  const title = isReadOnly
    ? 'Detalle de Categoría'
    : initialData
      ? 'Editar Categoría'
      : 'Crear Categoría';

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="sm"
      footer={
        !isReadOnly ? (
          <>
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button
              type="submit"
              form="category-form"
              className="btn-save"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        ) : (
          <button type="button" className="btn-save" onClick={handleClose}>
            Cerrar
          </button>
        )
      }
    >
      <div className="category-form-modal">
        {isReadOnly ? (
          <div className="category-detail-card">
            <i className="fa-solid fa-tag" style={{ fontSize: '1.5rem', color: '#C2435A' }} aria-hidden="true" />
            <div>
              <h3 className="category-detail-name">{initialData?.nombre}</h3>
              <span className={`category-detail-status ${initialData?.estado === 'Activo' ? 'active' : 'inactive'}`}>
                {initialData?.estado}
              </span>
            </div>
          </div>
        ) : (
          <form id="category-form" onSubmit={handleSubmit}>
            {formError && (
              <div className="form-error form-error-block" role="alert">
                {formError}
              </div>
            )}

            <FormTextField
              label="Nombre"
              value={values.nombre}
              onChange={(v) => setField('nombre', v)}
              onBlur={() => handleBlur('nombre')}
              placeholder="Ej: Día de la Madre"
              required
              error={errors.nombre}
            />
            {!initialData && (
              <div className="form-field">
                <label className="form-label">Estado</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setField('estado', values.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                    className={`status-toggle ${values.estado === 'Activo' ? 'active' : 'inactive'}`}
                    style={{ width: '46px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '2px', backgroundColor: values.estado === 'Activo' ? '#2E7D32' : '#E8D7DC', transition: 'background-color 0.2s ease' }}
                    title={values.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                  >
                    <div
                      className={`status-toggle-knob ${values.estado === 'Activo' ? 'active' : 'inactive'}`}
                      style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', position: 'absolute', left: values.estado === 'Activo' ? '24px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    />
                  </button>
                  <span style={{ color: 'var(--texto)', fontSize: '0.9rem' }}>{values.estado}</span>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
