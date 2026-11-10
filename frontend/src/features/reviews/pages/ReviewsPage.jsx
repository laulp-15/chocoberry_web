import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../../login/hooks/useAuth';
import ReviewCard from '../components/ReviewCard';
import ReviewFormModal from '../components/ReviewFormModal';
import './ReviewsPage.css';

// Portal para la alerta de autenticación - se renderiza en document.body
function AuthAlert({ isOpen, message }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="auth-alert-toast">
      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <div>
        <strong>¡Atención!</strong>
        <span>{message}</span>
      </div>
    </div>,
    document.body
  );
}

export default function ReviewsPage() {
  const { reviews, loading, error, addReview, reload } = useReviews();
  const { user, isAuthenticated, role } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authAlert, setAuthAlert] = useState("");
  
  // Estado para controlar el filtro de estrellas (null u 0 significa "Todas")
  const [selectedRating, setSelectedRating] = useState(null);

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating - fullStars >= 0.5;

  const handleAddReview = () => {
    if (!isAuthenticated) {
      setAuthAlert("Debes iniciar sesión o registrarte para poder dejar una reseña. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
      return;
    }

    if (role === "repartidor") {
      setAuthAlert("Las reseñas solo pueden publicarlas clientes y administradores.");
      setTimeout(() => setAuthAlert(""), 4000);
      return;
    }

    setIsModalOpen(true);
  };

  // Filtrar las reseñas según la estrella seleccionada
  const filteredReviews = selectedRating 
    ? reviews.filter((review) => Number(review.rating) === Number(selectedRating))
    : reviews;

  return (
    <div className="reviews-page-wrapper">
      {/* Fondo Decorativo Sutil */}
      <div className="bg-glow-pink"></div>
      <div className="bg-glow-choco"></div>

      <div className="reviews-page-container">
        
        {/* ENCABEZADO DESTACADO */}
        <header className="reviews-hero">
          <div className="hero-badge">
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
            <span>Voces de ChocoBerry</span>
          </div>
          <h1>Historias que nos <span className="highlight-text">Endulzan</span></h1>
          <p className="hero-subtitle">
            Descubre por qué nuestros clientes eligen ChocoBerry para regalar amor y momentos inolvidables en Medellín.
          </p>

          {/* TARJETA RESUMEN DE CALIFICACIÓN */}
          <div className="rating-summary-hero">
            <div className="score-block">
              <div className="big-number">
                {reviews.length ? averageRating.toFixed(1) : "—"}
              </div>
              <div className="stars-and-label">
                <div
                  className="stars-row"
                  aria-label={
                    reviews.length
                      ? `Promedio de ${averageRating.toFixed(1)} de 5 estrellas`
                      : "Sin calificaciones todavía"
                  }
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    let icon = "fa-regular fa-star";
                    if (star <= fullStars) icon = "fa-solid fa-star";
                    else if (star === fullStars + 1 && hasHalfStar) {
                      icon = "fa-solid fa-star-half-stroke";
                    }

                    return (
                      <i
                        key={star}
                        className={icon}
                        style={{ color: '#F49B05', fontSize: '1.1rem' }}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <span className="count-label">
                  {reviews.length
                    ? `${reviews.length} ${reviews.length === 1 ? 'reseña' : 'reseñas'}`
                    : 'Sé el primero en opinar'}
                </span>
              </div>
            </div>

            <button className="btn-add-review-hero" onClick={handleAddReview}>
              <i className="fa-solid fa-comment-medical" aria-hidden="true" />
              <span>Dejar mi Reseña</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="reviews-content">
          
          {/* BARRA DE FILTROS POR ESTRELLAS */}
          <div className="reviews-filter-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedRating(null)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid #7A3245',
                backgroundColor: selectedRating === null ? '#7A3245' : 'transparent',
                color: selectedRating === null ? '#fff' : '#7A3245',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Todas
            </button>

            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRating(star)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid #7A3245',
                  backgroundColor: selectedRating === star ? '#7A3245' : 'transparent',
                  color: selectedRating === star ? '#fff' : '#7A3245',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s'
                }}
              >
                <span>{star}</span>
                <i className="fa-solid fa-star" style={{ color: selectedRating === star ? '#F49B05' : '#F49B05', fontSize: '0.9rem' }} />
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando comentarios llenos de dulzura...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <i
                className="fa-solid fa-triangle-exclamation"
                style={{ fontSize: '3rem', color: '#7A3245' }}
                aria-hidden="true"
              />
              <h3>No pudimos cargar las reseñas</h3>
              <p>{error}</p>
              <button type="button" className="btn-add-review-hero" onClick={reload}>
                <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="empty-state">
              <i 
                className="fa-solid fa-handshake-angle" 
                style={{ fontSize: '3rem', color: '#7A3245' }} 
                aria-hidden="true" 
              />
              <h3>
                {reviews.length === 0
                  ? 'Todavía no hay reseñas'
                  : 'No hay reseñas con este filtro'}
              </h3>
              <p>
                {reviews.length === 0
                  ? 'Sé el primero en compartir tu experiencia con ChocoBerry.'
                  : 'Intenta seleccionando otro número de estrellas.'}
              </p>
            </div>
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((item) => (
                <ReviewCard key={item.id} review={item} />
              ))}
            </div>
          )}
        </main>

        {/* ALERTA DE AUTENTICACIÓN - Portal en document.body */}
        <AuthAlert isOpen={Boolean(authAlert)} message={authAlert} />

        {/* MODAL PARA NUEVA RESEÑA */}
        <ReviewFormModal 
          key={isModalOpen ? "review-modal-open" : "review-modal-closed"}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={addReview}
          userName={user?.fullName}
        />

      </div>
    </div>
  );
}