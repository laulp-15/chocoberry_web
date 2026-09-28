// src/admin/admin-reviews/pages/ReviewsListPage.jsx
import React from 'react';
import { useReviews } from '../hooks/useReviews';
import ReviewDetailModal from '../components/ReviewDetailModal';
import DataTable from '../../../../shared/components/DataTable';
import FormSelect from '../../../../shared/components/FormSelect';
import './ReviewsListPage.css';

export default function ReviewsListPage() {
  const {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    currentPage,
    totalPages,
    handlePageChange,
    isDetailOpen,
    setIsDetailOpen,
    selectedReview,
    currentReviews,
    totalReviewsCount,
    handleToggleStatus,
    handleOpenDetail
  } = useReviews();

  // Definición de las columnas adaptadas para DataTable en modo oscuro
  const columns = [
    {
      key: 'cliente',
      label: 'CLIENTE',
      render: (review) => <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{review.cliente}</span>
    },
    {
      key: 'producto',
      label: 'PRODUCTO',
      render: (review) => <span style={{ color: 'var(--texto-muted)' }}>{review.producto}</span>
    },
    {
      key: 'calificacion',
      label: 'CALIFICACIÓN',
      render: (review) => (
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={star <= review.calificacion ? "fa-solid fa-star" : "fa-regular fa-star"}
              style={{
                color: star <= review.calificacion ? '#FFB800' : 'var(--borde)',
                fontSize: '0.9rem'
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      )
    },
    {
      key: 'comentario',
      label: 'COMENTARIO',
      render: (review) => (
        <span style={{ color: 'var(--texto-muted)', maxWidth: '280px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {review.comentario}
        </span>
      )
    },
    {
      key: 'fecha',
      label: 'FECHA',
      render: (review) => <span style={{ color: 'var(--texto-muted)', fontSize: '0.85rem' }}>{review.fecha}</span>
    },
    {
      key: 'estado',
      label: 'ESTADO',
      align: 'center',
      render: (review) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(review.id)}
          className={`status-toggle ${review.estado === 'Activo' ? 'active' : 'inactive'}`}
          title={`Estado: ${review.estado}. Clic para cambiar.`}
        >
          <div className={`status-toggle-knob ${review.estado === 'Activo' ? 'active' : 'inactive'}`} />
        </button>
      )
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'right',
      render: (review) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(review)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="reviews-page">
      <DataTable
        title="Reseñas"
        description="Consulta y gestiona las calificaciones y comentarios enviados por los clientes."
        columns={columns}
        data={currentReviews}
        searchPlaceholder="Buscar por cliente, producto o comentario..."
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        extraFilter={
          <FormSelect
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' },
            ]}
            placeholder="Todos los estados"
          />
        }
      />

      {/* MODAL VER DETALLE */}
      <ReviewDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        review={selectedReview}
      />
    </div>
  );
}
