// src/admin/admin-reviews/components/ReviewDetailModal.jsx
import React from 'react';
import Modal from '../../../../shared/components/Modal';
import './ReviewDetailModal.css';

export default function ReviewDetailModal({ isOpen, onClose, review }) {
  if (!review) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Detalle de la Reseña"
      maxWidth="sm"
      footer={
        <button type="button" className="review-detail-close" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      <div className="review-detail-card">
        <div>
          <h3 className="review-detail-name">{review.cliente}</h3>
          <span className="review-detail-product">
            Producto: <strong style={{ color: 'var(--texto)' }}>{review.producto}</strong>
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label className="review-detail-label">CALIFICACIÓN</label>
        <div className="review-detail-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fa-solid fa-star review-detail-star ${star <= review.calificacion ? 'filled' : 'empty'}`}
              aria-hidden="true"
            />
          ))}
          <span className="review-detail-rating">{review.calificacion}/5</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label className="review-detail-label">FECHA</label>
        <p className="review-detail-value">{review.fecha}</p>
      </div>

      <div>
        <label className="review-detail-label">COMENTARIO</label>
        <p className="review-detail-comment">"{review.comentario}"</p>
      </div>
    </Modal>
  );
}
