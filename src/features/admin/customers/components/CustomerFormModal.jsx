import React, { useEffect } from 'react';
import useFormValidation from '../../../../shared/hooks/useFormValidation';
import { validatePhone } from '../../../login/utils/validators';

const EMPTY_CUSTOMER = { nombre: '', telefono: '', direccion: '', correo: '' };

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '0.6rem 0.9rem',
  borderRadius: '10px',
  border: hasError ? '1px solid #E63950' : '1px solid #EADBDA',
  outline: 'none',
  boxSizing: 'border-box',
});

const errorStyle = { color: '#E63950', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' };

export default function CustomerFormModal({ isOpen, onClose, onSubmit, initialData, isReadOnly = false }) {
  const { values, errors, setField, handleBlur, validateAll, reset } = useFormValidation({
    initialValues: EMPTY_CUSTOMER,
    validators: {
      nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
      correo: (v) => (v.correo.trim() ? '' : 'El correo es obligatorio.'),
      telefono: (v) => validatePhone(v.telefono),
    },
  });

  useEffect(() => {
    reset(
      initialData
        ? {
            nombre: initialData.nombre || '',
            telefono: initialData.telefono || '',
            direccion: initialData.direccion || '',
            correo: initialData.correo || '',
          }
        : EMPTY_CUSTOMER
    );
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    onSubmit({
      nombre: values.nombre,
      telefono: values.telefono,
      direccion: values.direccion,
      correo: values.correo,
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#471C26', fontSize: '1.3rem', fontWeight: 'bold' }}>
            {isReadOnly ? 'Detalle del Cliente' : initialData ? 'Editar Cliente' : 'Crear Cliente'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5A54' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }} aria-hidden="true" />
          </button>
        </div>

        {isReadOnly ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ backgroundColor: '#FDF2F4', padding: '1rem', borderRadius: '12px' }}>
              <h3 style={{ margin: 0, color: '#471C26', fontSize: '1.15rem' }}>{initialData?.nombre}</h3>
              <span style={{ fontSize: '0.85rem', color: '#6B5A54', marginTop: '0.2rem', display: 'block' }}>Estado: <strong>{initialData?.estado}</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ color: '#6B5A54', fontWeight: 'bold', fontSize: '0.8rem', display: 'block' }}>TELÉFONO</label>
                <p style={{ color: '#471C26', marginTop: '0.3rem', fontSize: '0.95rem' }}>{initialData?.telefono}</p>
              </div>
              <div>
                <label style={{ color: '#6B5A54', fontWeight: 'bold', fontSize: '0.8rem', display: 'block' }}>CORREO</label>
                <p style={{ color: '#471C26', marginTop: '0.3rem', fontSize: '0.95rem' }}>{initialData?.correo}</p>
              </div>
            </div>

            <div>
              <label style={{ color: '#6B5A54', fontWeight: 'bold', fontSize: '0.8rem', display: 'block' }}>DIRECCIÓN</label>
              <p style={{ color: '#471C26', marginTop: '0.3rem', fontSize: '0.95rem' }}>{initialData?.direccion}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={onClose} style={{ backgroundColor: '#E63950', color: '#ffffff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#471C26', fontWeight: '600', fontSize: '0.85rem' }}>Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: María Lucía Gómez"
                value={values.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                onBlur={() => handleBlur('nombre')}
                style={inputStyle(errors.nombre)}
              />
              {errors.nombre && <span style={errorStyle}>{errors.nombre}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', color: '#471C26', fontWeight: '600', fontSize: '0.85rem' }}>Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 3001234567"
                  value={values.telefono}
                  onChange={(e) => setField('telefono', e.target.value)}
                  onBlur={() => handleBlur('telefono')}
                  style={inputStyle(errors.telefono)}
                />
                {errors.telefono && <span style={errorStyle}>{errors.telefono}</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', color: '#471C26', fontWeight: '600', fontSize: '0.85rem' }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={values.correo}
                  onChange={(e) => setField('correo', e.target.value)}
                  onBlur={() => handleBlur('correo')}
                  style={inputStyle(errors.correo)}
                />
                {errors.correo && <span style={errorStyle}>{errors.correo}</span>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#471C26', fontWeight: '600', fontSize: '0.85rem' }}>Dirección</label>
              <input
                type="text"
                placeholder="Ej: Calle 10 #43-12, Medellín"
                value={values.direccion}
                onChange={(e) => setField('direccion', e.target.value)}
                onBlur={() => handleBlur('direccion')}
                style={inputStyle(errors.direccion)}
              />
              {errors.direccion && <span style={errorStyle}>{errors.direccion}</span>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} style={{ backgroundColor: '#F5EFEA', color: '#471C26', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" style={{ backgroundColor: '#E63950', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
