// src/admin/products/components/ProductFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import FormSelect from '../../../../shared/components/FormSelect';
import './ProductFormModal.css';

const CATEGORIA_OPTIONS = [
  { value: 'Fechas especiales', label: 'Fechas especiales' },
  { value: 'Cumpleaños', label: 'Cumpleaños' },
  { value: 'Aniversarios', label: 'Aniversarios' },
  { value: 'Regalos', label: 'Regalos' },
];

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, isReadOnly = false }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');

  const [imagen, setImagen] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setCategoria(initialData.categoria || 'Fechas especiales');
      setImagen(initialData.imagen || initialData.foto || initialData.url || '');
    } else {
      setNombre('');
      setDescripcion('');
      setCategoria('');
      setImagen('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleImageChange = (e) => {
    setErrors(prev => ({ ...prev, imagen: undefined }));
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagen(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!descripcion.trim()) newErrors.descripcion = "La descripción es obligatoria.";
    if (!categoria) newErrors.categoria = "Selecciona una categoría.";
    if (!imagen) newErrors.imagen = "La fotografía del producto es obligatoria.";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    onSubmit({
      nombre,
      descripcion,
      categoria,
      imagen
    });
    onClose();
  };

  const productImg = initialData?.imagen || initialData?.foto || initialData?.url;
  const title = isReadOnly ? 'Detalle del Producto' : initialData ? 'Editar Producto' : 'Crear Producto';

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
          <button type="button" className="product-detail-close" onClick={onClose}>
            Cerrar
          </button>
        )
      }
    >
      <div className="product-form-modal">
        {isReadOnly ? (
          <>
            <div className="product-detail-image-wrapper">
              {productImg ? (
                <img
                  src={productImg}
                  alt={initialData?.nombre}
                  className="product-detail-image-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="product-detail-image-placeholder">
                  <i className="fa-solid fa-image" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}></i>
                  <span style={{ fontSize: '0.8rem' }}>Sin imagen registrada</span>
                </div>
              )}
            </div>

            <div className="product-detail-card">
              <div className="product-detail-header">
                <h2 className="product-detail-name">{initialData?.nombre}</h2>
                <span className={`product-detail-status ${initialData?.estado === 'Activo' ? 'active' : 'inactive'}`}>
                  {initialData?.estado}
                </span>
              </div>
              <div className="product-detail-meta">
                <span className="product-detail-category">
                  <i className="fa-solid fa-tag" /> {initialData?.categoria}
                </span>
              </div>
            </div>

            <div className="product-detail-card product-detail-description-card">
              <h3 className="product-detail-section-title">Descripción</h3>
              <p className="product-detail-value">{initialData?.descripcion || 'Sin descripción disponible'}</p>
            </div>

            </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Nombre del Producto"
              value={nombre}
              onChange={(v) => { setNombre(v); setErrors(prev => ({ ...prev, nombre: undefined })); }}
              placeholder="Ej: Caja Corazón Rosas"
              required
              error={errors.nombre}
            />

            <div className="form-field">
              <label className="form-label">Fotografía del Producto *</label>
              {imagen ? (
                <div className="image-preview">
                  <img src={imagen} alt="Vista previa" className="image-preview-img" />
                  <div className="image-preview-info">
                    <span className="image-preview-name">Imagen cargada con éxito</span>
                    <span className="image-preview-ready">Lista para guardar</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagen('')}
                    className="image-preview-remove"
                    title="Cambiar imagen"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ) : (
                <label className={`image-upload-zone ${errors.imagen ? 'has-error' : ''}`}>
                  <div className="image-upload-icon">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <span className="image-upload-text">Haz clic para elegir una foto</span>
                  <span className="image-upload-hint">PNG, JPG o WEBP desde tus archivos</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              {errors.imagen && <div className="form-error">{errors.imagen}</div>}
            </div>

            <FormTextField
              label="Descripción"
              value={descripcion}
              onChange={(v) => { setDescripcion(v); setErrors(prev => ({ ...prev, descripcion: undefined })); }}
              placeholder="Breve descripción del producto..."
              multiline
              minRows={3}
              required
              error={errors.descripcion}
            />

            <FormSelect
              label="Categoría"
              value={categoria}
              onChange={(v) => { setCategoria(v); setErrors(prev => ({ ...prev, categoria: undefined })); }}
              options={CATEGORIA_OPTIONS}
              required
              error={errors.categoria}
            />
          </form>
        )}
      </div>
    </Modal>
  );
}
