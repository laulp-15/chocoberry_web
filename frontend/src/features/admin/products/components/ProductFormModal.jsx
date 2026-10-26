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

const MAX_IMAGENES = 4;

/**
 * Imágenes iniciales del formulario a partir de los datos del producto.
 * Se calculan una sola vez al montar el contenido (el modal usa `key` para
 * reiniciarse al abrir otro producto).
 */
function imagenesIniciales(initialData) {
  if (!initialData) return [];

  const existentes =
    Array.isArray(initialData.imagenes) && initialData.imagenes.length > 0
      ? initialData.imagenes
      : initialData.imagen
        ? [{ id: 'portada', url: initialData.imagen, orden: 1 }]
        : [];

  return existentes.map((imagen, index) => ({
    key: `existente-${imagen.id ?? imagen.url ?? index}`,
    tipo: 'existente',
    url: imagen.url,
    preview: imageUrl(imagen.url),
  }));
}

/**
 * Contenido del modal. Se monta solo mientras el modal está abierto y se
 * reinicia con `key`, así los valores iniciales se toman en el `useState`
 * (sin `setState` dentro de un efecto).
 */
function ProductoFormulario({
  initialData,
  isReadOnly,
  categorias,
  onSubmit,
  onClose,
}) {
  // Imagen ampliada (funciona en el detalle y en crear/editar).
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [imagenes, setImagenes] = useState(() => imagenesIniciales(initialData));
  const [imagenError, setImagenError] = useState('');
  const [detailIndex, setDetailIndex] = useState(0);
  const [formError, setFormError] = useState('');
  // URLs temporales (blob:) de las fotos nuevas, para poder liberarlas.
  const objectUrlsRef = useRef([]);

  const { values, errors, setField, handleBlur, setFieldError, validateAll } =
    useFormValidation({
      initialValues: {
        nombre: initialData?.nombre || '',
        descripcion: initialData?.descripcion || '',
        categoria: initialData?.categoriaId ? String(initialData.categoriaId) : '',
      },
      validators: {
        nombre: (v) => (v.nombre.trim() ? '' : 'El nombre es obligatorio.'),
        descripcion: (v) => (v.descripcion.trim() ? '' : 'La descripción es obligatoria.'),
        categoria: (v) => (v.categoria ? '' : 'Selecciona una categoría.'),
      },
      immediate: ['categoria'],
    });

  // Libera las vistas previas temporales al cerrar el modal (desmontaje).
  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    },
    []
  );

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (imagenes.length + files.length > MAX_IMAGENES) {
      setImagenError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }

    for (const file of files) {
      const validationError = validateFile(file, { allowPdf: false });
      if (validationError) {
        setImagenError(validationError);
        return;
      }
    }

    const nuevas = files.map((file) => {
      const preview = URL.createObjectURL(file);
      objectUrlsRef.current.push(preview);

      return {
        key: `nueva-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: 'nueva',
        file,
        preview,
      };
    });

    setImagenes((prev) => [...prev, ...nuevas]);
    setImagenError('');
  };

  const handleRemoveImage = (key) => {
    setImagenes((prev) => {
      const imagen = prev.find((item) => item.key === key);
      if (imagen?.tipo === 'nueva') {
        URL.revokeObjectURL(imagen.preview);
        objectUrlsRef.current = objectUrlsRef.current.filter(
          (url) => url !== imagen.preview
        );
      }
      return prev.filter((item) => item.key !== key);
    });
    setImagenError('');
  };

  const handleMoveImage = (index, delta) => {
    setImagenes((prev) => {
      const destino = index + delta;
      if (destino < 0 || destino >= prev.length) return prev;

      const copia = [...prev];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setImagenError('');
    if (!validateAll()) return;

    if (imagenes.length === 0) {
      setImagenError('Debes subir al menos una imagen.');
      return;
    }

    if (imagenes.length > MAX_IMAGENES) {
      setImagenError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }

    try {
      // El backend recibe las fotos como archivos (multipart) y el orden final.
      await onSubmit({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim(),
        categoriaId: Number(values.categoria),
        imagenes: imagenes.map(({ tipo, url, file }) => ({ tipo, url, file })),
      });
      onClose();
    } catch (err) {
      // Nombre repetido: el backend responde 409 y se marca bajo el campo.
      if (err?.code === 'NAME_TAKEN') {
        setFieldError('nombre', err.message);
      } else {
        setFormError(err?.message || 'No fue posible guardar el producto.');
      }
    }
  };

  const categoriaOptions = categorias.map((categoria) => ({
    value: String(categoria.id),
    label: categoria.nombre,
  }));

  const imagenesDetalle =
    Array.isArray(initialData?.imagenes) && initialData.imagenes.length > 0
      ? initialData.imagenes.map((imagen) => ({
          ...imagen,
          preview: imageUrl(imagen.url),
        }))
      : initialData?.imagen
        ? [{ url: initialData.imagen, preview: imageUrl(initialData.imagen) }]
        : [];
  const imagenPrincipal = imagenesDetalle[detailIndex] ?? imagenesDetalle[0];

  return (
    <div className="product-form-modal">
      {isReadOnly ? (
        <>
          <div className="product-detail-image-wrapper">
            {imagenPrincipal ? (
              <div className="product-detail-gallery">
                <button
                  type="button"
                  className="product-detail-image-thumb"
                  onClick={() => setLightboxSrc(imagenPrincipal.preview)}
                  title="Ver imagen ampliada"
                >
                  <img
                    src={imagenPrincipal.preview}
                    alt={initialData?.nombre}
                    className="product-detail-image-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="product-detail-image-zoom">
                    <i className="fa-solid fa-magnifying-glass-plus" />
                  </span>
                </button>

                {imagenesDetalle.length > 1 && (
                  <div className="product-detail-thumbs">
                    {imagenesDetalle.map((imagen, index) => (
                      <button
                        key={`${imagen.url}-${index}`}
                        type="button"
                        className={`product-detail-thumb ${
                          index === detailIndex ? 'active' : ''
                        }`}
                        onClick={() => setDetailIndex(index)}
                        title={`Imagen ${index + 1}`}
                      >
                        <img
                          src={imagen.preview}
                          alt={`${initialData?.nombre} ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="product-detail-image-placeholder">
                <i
                  className="fa-solid fa-image"
                  style={{ fontSize: '2rem', marginBottom: '0.4rem' }}
                />
                <span style={{ fontSize: '0.8rem' }}>Sin imagen registrada</span>
              </div>
            )}
          </div>

          <div className="product-detail-card">
            <div className="product-detail-header">
              <h2 className="product-detail-name">{initialData?.nombre}</h2>
              <span
                className={`product-detail-status ${
                  initialData?.estado === 'Activo' ? 'active' : 'inactive'
                }`}
              >
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
            <p className="product-detail-value">
              {initialData?.descripcion || 'Sin descripción disponible'}
            </p>
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
            <label className="form-label">Fotografías del Producto *</label>

            <div className="product-images-grid">
              {imagenes.map((imagen, index) => (
                <div key={imagen.key} className="product-image-slot">
                  <button
                    type="button"
                    className="product-image-preview"
                    onClick={() => setLightboxSrc(imagen.preview)}
                    title="Ver imagen ampliada"
                  >
                    <img src={imagen.preview} alt={`Imagen ${index + 1}`} />
                    {index === 0 && (
                      <span className="product-image-cover">Portada</span>
                    )}
                  </button>

                  <div className="product-image-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveImage(index, -1)}
                      title="Mover a la izquierda"
                    >
                      <i className="fa-solid fa-arrow-left" />
                    </button>
                    <button
                      type="button"
                      disabled={index === imagenes.length - 1}
                      onClick={() => handleMoveImage(index, 1)}
                      title="Mover a la derecha"
                    >
                      <i className="fa-solid fa-arrow-right" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imagen.key)}
                      title="Quitar imagen"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              ))}

              {imagenes.length < MAX_IMAGENES && (
                <label className="image-upload-zone product-image-add">
                  <div className="image-upload-icon">
                    <i className="fa-solid fa-cloud-arrow-up" />
                  </div>
                  <span className="image-upload-text">Agregar imagen</span>
                  <span className="image-upload-hint">
                    {imagenes.length}/{MAX_IMAGENES} · PNG, JPG o WEBP (máx. 5 MB)
                  </span>
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    onChange={handleAddImages}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {imagenError && <div className="form-error">{imagenError}</div>}
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

      {lightboxSrc && (
        <ImageLightbox
          open
          onClose={() => setLightboxSrc('')}
          src={lightboxSrc}
          alt={initialData?.nombre || 'Vista previa'}
        />
      )}
    </div>
  );
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isReadOnly = false,
  categorias = [],
  submitting = false,
}) {
  const title = isReadOnly
    ? 'Detalle del Producto'
    : initialData
      ? 'Editar Producto'
      : 'Crear Producto';

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
          <button type="button" className="product-detail-close" onClick={onClose}>
            Cerrar
          </button>
        )
      }
    >
      {isOpen && (
        <ProductoFormulario
          key={`${initialData?.id ?? 'nuevo'}-${isReadOnly ? 'detalle' : 'edicion'}`}
          initialData={initialData}
          isReadOnly={isReadOnly}
          categorias={categorias}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
