// src/features/admin/admin-reviews/components/ReviewDetailModal.jsx
import React from 'react';
import Modal from '../../../../shared/components/Modal';
import './ReviewDetailModal.css';

// Etiqueta textual de la calificación (mismos textos que el formulario público).
const RATING_LABELS = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Regular',
  4: 'Buena',
  5: '¡Excelente!',
};

// dd/mm/aaaa a partir del formato de los datos (aaaa-mm-dd).
function formatDisplayDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Detalle de una reseña (reseña general del negocio, sin producto asociado).
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {object} props.review - { cliente, calificacion, comentario, fecha, estado }
 */
export default function ReviewDetailModal({ isOpen, onClose, review }) {
  if (!review) return null;

  const initial = review.cliente ? review.cliente.charAt(0).toUpperCase() : '?';
  const isActive = review.estado === 'Activo';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Detalle de la reseña"
      maxWidth="sm"
      footer={
        <button type="button" className="review-detail-close" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {/* Encabezado: cliente + estado, con la fecha a la derecha */}
      <div className="review-detail-top">
        <div className="review-detail-client">
          <div className="review-detail-avatar" aria-hidden="true">{initial}</div>
          <div>
            <h3 className="review-detail-name">{review.cliente}</h3>
            <span className={`review-detail-status ${isActive ? 'is-active' : 'is-inactive'}`}>
              {review.estado}
            </span>
          </div>
        </div>

        <span className="review-detail-date">
          <i className="fa-solid fa-calendar" /> {formatDisplayDate(review.fecha)}
        </span>
      </div>

      {/* Calificación */}
      <div className="review-detail-section">
        <div className="review-detail-section-title">
          <i className="fa-solid fa-star" />
          Calificación
        </div>
        <div className="review-detail-rating">
          <div className="review-detail-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`fa-solid fa-star review-detail-star ${star <= review.calificacion ? 'filled' : 'empty'}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="review-detail-rating-value">{review.calificacion}/5</span>
          <span className="review-detail-rating-label">{RATING_LABELS[review.calificacion] || ''}</span>
        </div>
      </div>

      {/* Comentario */}
      <div className="review-detail-section">
        <div className="review-detail-section-title">
          <i className="fa-solid fa-quote-left" />
          Comentario
        </div>
        <p className="review-detail-comment">“{review.comentario}”</p>
      </div>
    </Modal>
  );
}
