// src/features/admin/presentations/components/PresentationFormModal.jsx
import { useEffect, useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import StatusToggle from '../../../../shared/components/StatusToggle';
import useFormValidation from '../../../../shared/hooks/useFormValidation';
import { formatPrice } from '../../../../shared/utils/formatPrice';
import { quantityLabel } from '../utils/presentationDisplay';

export default function PresentationFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
  submitting = false,
}) {
  const [formError, setFormError] = useState('');

  const { values, errors, setField, handleBlur, setFieldError, validateAll, reset } = useFormValidation({
    initialValues: { cantidadFresas: '', precio: '', estado: 'Activo' },
    validators: {
      cantidadFresas: (v) => {
        const raw = String(v.cantidadFresas ?? '').trim();
        if (!raw) return 'La cantidad de fresas es obligatoria.';
        const numero = Number(raw);
        if (!Number.isInteger(numero) || numero <= 0) {
          return 'Ingresa una cantidad entera mayor a 0.';
        }
        return '';
      },
      precio: (v) => {
        const raw = String(v.precio ?? '').trim();
        if (!raw) return 'El precio es obligatorio.';
        const numero = Number(raw);
        if (Number.isNaN(numero) || numero <= 0) {
          return 'Ingresa un precio mayor a 0.';
        }
        return '';
      },
    },
    immediate: ['estado'],
  });

  useEffect(() => {
    if (!isOpen) return;

    reset({
      cantidadFresas: initialData?.cantidadFresas ?? '',
      precio: initialData?.precio ?? '',
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
        cantidadFresas: Number(values.cantidadFresas),
        precio: Number(values.precio),
        estado: values.estado,
      });
      handleClose();
    } catch (err) {
      if (err?.code === 'QUANTITY_TAKEN') {
        setFieldError('cantidadFresas', err.message);
      } else {
        setFormError(err?.message || 'No fue posible guardar la presentación.');
      }
    }
  };

  const title = isReadOnly
    ? 'Detalle de Presentación'
    : initialData
      ? 'Editar Presentación'
      : 'Crear Presentación';

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
              form="presentation-form"
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
              <h3 className="crud-detail-name">
                {initialData ? quantityLabel(initialData.cantidadFresas) : '—'}
              </h3>
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
                <span className="crud-detail-label">Precio</span>
                <span className="crud-detail-value">
                  {initialData ? formatPrice(initialData.precio) : '—'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form id="presentation-form" onSubmit={handleSubmit}>
            {formError && (
              <div className="form-error form-error-block" role="alert">
                {formError}
              </div>
            )}

            <FormTextField
              label="Cantidad de fresas"
              type="number"
              value={values.cantidadFresas}
              onChange={(v) => setField('cantidadFresas', v)}
              onBlur={() => handleBlur('cantidadFresas')}
              placeholder="Ej: 12"
              required
              error={errors.cantidadFresas}
            />

            <FormTextField
              label="Precio"
              type="number"
              value={values.precio}
              onChange={(v) => setField('precio', v)}
              onBlur={() => handleBlur('precio')}
              placeholder="Ej: 55000"
              required
              error={errors.precio}
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
