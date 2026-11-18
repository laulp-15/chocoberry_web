// src/features/catalog/components/ProductGallery.jsx
import { useState } from "react";
import "./ProductGallery.css";

/**
 * Galería de imágenes del producto: imagen principal + miniaturas.
 * Si no se pasan imágenes, muestra un ícono placeholder.
 * La imagen principal lleva la etiqueta "Imagen de referencia".
 *
 * @param {object} props
 * @param {string[]} [props.images] - rutas de imágenes, ej: ["/img/productos/caja-lujo-1.jpg", ...]
 * @param {string} [props.alt]
 */
export default function ProductGallery({ images = [], alt = "" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;
  // Si la lista cambia y el índice queda fuera de rango, se ajusta.
  const safeIndex = hasImages ? Math.min(activeIndex, images.length - 1) : 0;
  const activeImage = images[safeIndex];

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        {hasImages ? (
          <>
            <img src={activeImage} alt={alt} />
            <span className="gallery-reference-tag">
              <i className="fa-solid fa-image" aria-hidden="true" />
              Imagen de referencia
            </span>
          </>
        ) : (
          <i className="fa-solid fa-image" />
        )}
      </div>

      {hasImages && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={`gallery-thumb ${safeIndex === i ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              <img src={src} alt={`${alt} ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}