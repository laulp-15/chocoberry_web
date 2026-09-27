// src/admin/products/components/ProductFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import FormSelect from '../../../../shared/components/FormSelect';
import './ProductFormModal.css';

const CATEGORIA_OPTIONS = [
  { value: 'Día de la Madre', label: 'Día de la Madre' },
  { value: 'Día del Padre', label: 'Día del Padre' },
  { value: 'Aniversarios', label: 'Aniversarios' },
  { value: 'Cumpleaños', label: 'Cumpleaños' },
  { value: 'Antojos', label: 'Antojos' },
  { value: 'Regalos', label: 'Regalos' },
];

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, isReadOnly = false }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Día de la Madre');

  const [imagen, setImagen] = useState('');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setCategoria(initialData.categoria || 'Día de la Madre');
      setImagen(initialData.imagen || initialData.foto || initialData.url || '');
    } else {
      setNombre('');
      setDescripcion('');
      setCategoria('Día de la Madre');
      setImagen('');
    }
  }, [initialData, isOpen]);

  const handleImageChange = (e) => {
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
    if (!nombre.trim()) return;
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
              Guardar Producto
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
            {productImg ? (
              <div className="product-detail-image">
                <img
                  src={productImg}
                  alt={initialData?.nombre}
                  className="product-detail-image-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="product-detail-image">
                <div className="product-detail-image-placeholder">
                  <i className="fa-solid fa-image" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}></i>
                  <span style={{ fontSize: '0.8rem' }}>Sin imagen registrada</span>
                </div>
              </div>
            )}

            <div className="product-detail-card">
              <h3 className="product-detail-name">{initialData?.nombre}</h3>
              <span className="product-detail-category">
                Categoría: <strong style={{ color: 'var(--texto)' }}>{initialData?.categoria}</strong>
              </span>
            </div>

            <div className="form-field">
              <label className="product-detail-label">DESCRIPCIÓN</label>
              <p className="product-detail-value">{initialData?.descripcion || 'Sin descripción disponible'}</p>
            </div>


          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Nombre del Producto"
              value={nombre}
              onChange={setNombre}
              placeholder="Ej: Caja Corazón Rosas"
              required
            />

            <div className="form-field">
              <label className="form-label">Fotografía del Producto</label>
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
                <label className="image-upload-zone">
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
            </div>

            <FormTextField
              label="Descripción"
              value={descripcion}
              onChange={setDescripcion}
              placeholder="Breve descripción del producto..."
              multiline
              minRows={3}
            />

            <FormSelect
              label="Categoría"
              value={categoria}
              onChange={setCategoria}
              options={CATEGORIA_OPTIONS}
            />
          </form>
        )}
      </div>
    </Modal>
  );
}
