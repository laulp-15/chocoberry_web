// src/features/admin/admin-reviews/pages/ReviewsListPage.jsx
import { useReviews } from '../hooks/useReviews';
import ReviewDetailModal from '../components/ReviewDetailModal';
import DataTable from '../../../../shared/components/DataTable';
import FormSelect from '../../../../shared/components/FormSelect';
import { formatDisplayDate } from '../../orders/utils/orderDisplay';
import '../../../../shared/css/adminCrud.css';
import './ReviewsListPage.css';

export default function ReviewsListPage() {
  const {
    statusFilter,
    handleStatusFilterChange,
    isDetailOpen,
    setIsDetailOpen,
    selectedReview,
    reviews,
    loading,
    error,
    reload,
    togglingId,
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
      render: (review) => (
        <span style={{ color: 'var(--texto-muted)', fontSize: '0.85rem' }}>
          {formatDisplayDate(review.fecha)}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'ESTADO',
      align: 'center',
      render: (review) => {
        const isToggling = togglingId === review.id;
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(review)}
            className={`status-toggle ${review.estado === 'Activo' ? 'active' : 'inactive'}`}
            title={
              isToggling
                ? 'Actualizando estado...'
                : `Estado: ${review.estado}. Clic para cambiar.`
            }
            aria-label={`Cambiar estado de la reseña de ${review.cliente}`}
            aria-pressed={review.estado === 'Activo'}
            disabled={isToggling}
          >
            <div className={`status-toggle-knob ${review.estado === 'Activo' ? 'active' : 'inactive'}`} />
          </button>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { textAlign: 'right', paddingRight: '2rem' },
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
        data={reviews}
        searchPlaceholder="Buscar por cliente o comentario..."
        emptyMessage={
          loading
            ? "Cargando reseñas..."
            : error
              ? "No se pudieron cargar las reseñas."
              : "No hay reseñas para mostrar."
        }
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

      {error && (
        <p className="crud-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="crud-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      {/* MODAL VER DETALLE */}
      <ReviewDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        review={selectedReview}
      />
    </div>
  );
}
