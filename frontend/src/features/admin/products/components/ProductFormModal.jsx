// src/features/admin/products/components/ProductFormModal.jsx
import { useEffect, useRef, useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import FormTextField from '../../../../shared/components/FormTextField';
import FormSelect from '../../../../shared/components/FormSelect';
import ImageLightbox from '../../../../shared/components/ImageLightbox';
import useFormValidation from '../../../../shared/hooks/useFormValidation';
import { IMAGE_ACCEPT, validateFile } from '../../../../shared/utils/fileValidation';
import { imageUrl } from '../../../../shared/utils/imageUrl';
import './ProductFormModal.css';

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
  categorias = [],
  submitting = false,
}) {
  // Visor ampliado de la imagen (funciona en el detalle y en crear/editar).
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imagenFile, setImagenFile] = useState(null);
  const [formError, setFormError] = useState('');
  // URL temporal (blob:) de la foto recién elegida, para poder liberarla.
  const objectUrlRef = useRef(null);

  const { values, errors, setField, handleBlur, setFieldError, validateAll, reset } =
    useFormValidation({
      initialValues: { nombre: '', descripcion: '', categoria: '', imagen: '' },
      validators: {
        nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
        descripcion: (v) => (v.descripcion.trim() ? '' : 'La descripción es obligatoria.'),
        categoria: (v) => (v.categoria ? '' : 'Selecciona una categoría.'),
        imagen: (v) => (v.imagen ? '' : 'La fotografía del producto es obligatoria.'),
      },
      immediate: ['categoria', 'imagen'],
    });

  useEffect(() => {
    if (!isOpen) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    reset(
      initialData
        ? {
            nombre: initialData.nombre || '',
            descripcion: initialData.descripcion || '',
            categoria: initialData.categoriaId ? String(initialData.categoriaId) : '',
            imagen: imageUrl(initialData.imagen),
          }
        : { nombre: '', descripcion: '', categoria: '', imagen: '' }
    );
  }, [initialData, isOpen]);

  // Libera la última vista previa temporal al desmontar el modal.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const handleClose = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImagenFile(null);
    setFormError('');
    setLightboxOpen(false);
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file, { allowPdf: false });
    if (validationError) {
      setFieldError('imagen', validationError);
      e.target.value = '';
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    setImagenFile(file);
    setField('imagen', objectUrl);
  };

  const handleRemoveImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImagenFile(null);
    setField('imagen', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateAll()) return;

    try {
      // El backend recibe la foto como archivo (multipart) y guarda su ruta.
      await onSubmit({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim(),
        categoriaId: Number(values.categoria),
        imagenFile,
      });
      handleClose();
    } catch (err) {
      // Nombre repetido: el backend responde 409 y se marca bajo el campo.
      if (err?.code === 'NAME_TAKEN') {
        setFieldError('nombre', err.message);
      } else {
        setFormError(err?.message || 'No fue posible guardar el producto.');
      }
    }
  };

  const productImg = imageUrl(initialData?.imagen);
  const title = isReadOnly
    ? 'Detalle del Producto'
    : initialData
      ? 'Editar Producto'
      : 'Crear Producto';
  // Imagen visible según el modo: la cargada en el formulario o la del detalle.
  const shownImage = isReadOnly ? productImg : values.imagen;

  const categoriaOptions = categorias.map((categoria) => ({
    value: String(categoria.id),
    label: categoria.nombre,
  }));

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
              form="product-form"
              className="btn-save"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        ) : (
          <button type="button" className="product-detail-close" onClick={handleClose}>
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
                <button
                  type="button"
                  className="product-detail-image-thumb"
                  onClick={() => setLightboxOpen(true)}
                  title="Ver imagen ampliada"
                >
                  <img
                    src={productImg}
                    alt={initialData?.nombre}
                    className="product-detail-image-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="product-detail-image-zoom">
                    <i className="fa-solid fa-magnifying-glass-plus" />
                  </span>
                </button>
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
                  <i className="fa-solid fa-tag" /> {initialData?.categoriaNombre}
                </span>
              </div>
            </div>

            <div className="product-detail-card product-detail-description-card">
              <h3 className="product-detail-section-title">Descripción</h3>
              <p className="product-detail-value">{initialData?.descripcion || 'Sin descripción disponible'}</p>
            </div>
          </>
        ) : (
          <form id="product-form" onSubmit={handleSubmit}>
            {formError && (
              <div className="form-error form-error-block" role="alert">
                {formError}
              </div>
            )}

            <FormTextField
              label="Nombre del Producto"
              value={values.nombre}
              onChange={(v) => setField('nombre', v)}
              onBlur={() => handleBlur('nombre')}
              placeholder="Ej: Caja Corazón Rosas"
              required
              error={errors.nombre}
            />

            <div className="form-field">
              <label className="form-label">Fotografía del Producto *</label>
              {values.imagen ? (
                <div className="image-preview">
                  <button
                    type="button"
                    className="image-preview-thumb"
                    onClick={() => setLightboxOpen(true)}
                    title="Ver imagen ampliada"
                  >
                    <img src={values.imagen} alt="Vista previa" className="image-preview-img" />
                    <span className="image-preview-zoom">
                      <i className="fa-solid fa-magnifying-glass-plus" />
                    </span>
                  </button>
                  <div className="image-preview-info">
                    <span className="image-preview-name">Imagen cargada con éxito</span>
                    <span className="image-preview-ready">Lista para guardar</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
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
                  <span className="image-upload-hint">PNG, JPG o WEBP (máx. 5 MB)</span>
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              {errors.imagen && <div className="form-error">{errors.imagen}</div>}
            </div>

            <FormTextField
              label="Descripción"
              value={values.descripcion}
              onChange={(v) => setField('descripcion', v)}
              onBlur={() => handleBlur('descripcion')}
              placeholder="Breve descripción del producto..."
              multiline
              minRows={3}
              required
              error={errors.descripcion}
            />

            <FormSelect
              label="Categoría"
              value={values.categoria}
              onChange={(v) => setField('categoria', v)}
              onBlur={() => handleBlur('categoria')}
              options={categoriaOptions}
              required
              error={errors.categoria}
            />
          </form>
        )}

        {shownImage && (
          <ImageLightbox
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            src={shownImage}
            alt={initialData?.nombre || 'Vista previa'}
          />
        )}
      </div>
    </Modal>
  );
}
