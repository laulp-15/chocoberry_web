// src/features/admin/municipalities/components/MunicipalityFormModal.jsx
import { useEffect, useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import StatusToggle from '../../../../shared/components/StatusToggle';
import useFormValidation from '../../../../shared/hooks/useFormValidation';
import { formatPrice } from '../../../../shared/utils/formatPrice';

export default function MunicipalityFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
  submitting = false,
}) {
  const [formError, setFormError] = useState('');

  const { values, errors, setField, handleBlur, setFieldError, validateAll, reset } = useFormValidation({
    initialValues: { nombre: '', costoEnvio: '', estado: 'Activo' },
    validators: {
      nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
      costoEnvio: (v) => {
        const raw = String(v.costoEnvio ?? '').trim();
        if (!raw) return 'El costo de envío es obligatorio.';
        const numero = Number(raw);
        if (Number.isNaN(numero) || numero < 0) {
          return 'Ingresa un costo válido (mayor o igual a 0).';
        }
        return '';
      },
    },
    immediate: ['estado'],
  });

  useEffect(() => {
    reset({
      nombre: initialData?.nombre || '',
      costoEnvio: initialData?.costoEnvio ?? '',
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
      await onSubmit({
        nombre: values.nombre.trim(),
        costoEnvio: Number(values.costoEnvio),
        estado: values.estado,
      });
      handleClose();
    } catch (err) {
      if (err?.code === 'NAME_TAKEN') {
        setFieldError('nombre', err.message);
      } else {
        setFormError(err?.message || 'No fue posible guardar el municipio.');
      }
    }
  };

  const title = isReadOnly
    ? 'Detalle de Municipio'
    : initialData
      ? 'Editar Municipio'
      : 'Crear Municipio';

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
              form="municipality-form"
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
      <div className="crud-form-modal">
        {isReadOnly ? (
          <div className="crud-detail-card">
            <div className="crud-detail-header">
              <h3 className="crud-detail-name">{initialData?.nombre}</h3>
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
                <span className="crud-detail-label">Costo de envío</span>
                <span className="crud-detail-value">
                  {initialData ? formatPrice(initialData.costoEnvio) : '—'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form id="municipality-form" onSubmit={handleSubmit}>
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
              placeholder="Ej: Medellín"
              required
              error={errors.nombre}
            />

            <FormTextField
              label="Costo de envío"
              type="number"
              value={values.costoEnvio}
              onChange={(v) => setField('costoEnvio', v)}
              onBlur={() => handleBlur('costoEnvio')}
              placeholder="Ej: 10000"
              required
              error={errors.costoEnvio}
            />

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
