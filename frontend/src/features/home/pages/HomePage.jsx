// src/features/home/pages/HomePage.jsx
//
// Orden de la página:
// carrusel → categorías → productos (carrusel horizontal) → pasos del pedido →
// más vendidos → por qué elegirnos → video → reseñas → preguntas frecuentes.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCatalogo from "../../catalog/hooks/useCatalogo";
import { useReviews } from "../../reviews/hooks/useReviews";
import BestSellers from "../components/BestSellers";
import CategoryStrip from "../components/CategoryStrip";
import FaqSection from "../components/FaqSection";
import HeroBanner from "../components/HeroBanner";
import HomeBackdrop from "../components/HomeBackdrop";
import HomeCatalog from "../components/HomeCatalog";
import OrderSteps from "../components/OrderSteps";
import useScrollReveal from "../hooks/useScrollReveal";
import "../components/Home.css";

const MAX_REVIEWS = 5;
const REVIEW_INTERVAL_MS = 7000;

export default function HomePage() {
  const revealRef = useScrollReveal();
  const catalogo = useCatalogo();
  const { reviews: allReviews } = useReviews();

  const [activeCategory, setActiveCategory] = useState("todas");
  const [currentReview, setCurrentReview] = useState(0);
  const [reviewsPaused, setReviewsPaused] = useState(false);

  // Las mejores reseñas (4 y 5 estrellas) vienen del módulo de reseñas
  const reviews = allReviews.filter((r) => r.rating >= 4).slice(0, MAX_REVIEWS);
  const total = reviews.length;

  // Cambio automático; se detiene mientras el mouse está sobre la reseña
  useEffect(() => {
    if (reviewsPaused || total < 2) return undefined;
    const timer = setTimeout(() => {
      setCurrentReview((prev) => (prev + 1) % total);
    }, REVIEW_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [currentReview, reviewsPaused, total]);

  const nextReview = () => setCurrentReview((prev) => (prev + 1) % total);
  const prevReview = () => setCurrentReview((prev) => (prev - 1 + total) % total);

  return (
    <div className="home-page-wrapper">
      <HomeBackdrop />

      {/* ============ 1. CARRUSEL + 2. CATEGORÍAS ============ */}
      <HeroBanner />
      <CategoryStrip
        categories={catalogo.categorias}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="home-container" ref={revealRef}>
        {/* ============ 3. PRODUCTOS (carrusel horizontal) ============ */}
        <HomeCatalog
          productos={catalogo.productos}
          categorias={catalogo.categorias}
          activeCategory={activeCategory}
          minPrice={catalogo.minPrice}
          loading={catalogo.loading}
          error={catalogo.error}
          reload={catalogo.reload}
        />

        {/* ============ 4. PASOS PARA HACER EL PEDIDO ============ */}
        <OrderSteps />

        {/* ============ 5. MÁS VENDIDOS ============ */}
        <BestSellers
          productos={catalogo.masVendidos}
          minPrice={catalogo.minPrice}
          loading={catalogo.loading}
          error={catalogo.error}
        />

        {/* ============ RESEÑAS ============ */}
{reviews.length > 0 && (
  <section className="reviews-section">
    <div className="reviews-header-modern">
      <h2 className="reviews-title">
        Lo que dicen nuestros clientes
      </h2>
    </div>

    <div
      className="reviews-interactive-wrapper"
      onMouseEnter={() => setReviewsPaused(true)}
      onMouseLeave={() => setReviewsPaused(false)}
    >
      <button
        className="review-arrow-btn btn-left-modern"
        onClick={prevReview}
        aria-label="Reseña anterior"
        disabled={total < 2}
      >
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>

      {/* Contenedor de las 3 tarjetas visibles */}
      <div className="reviews-grid-container">
        {(() => {
          const visibleReviews = [];
          for (let i = 0; i < Math.min(3, total); i++) {
            const index = (currentReview + i) % total;
            visibleReviews.push(reviews[index]);
          }

          return visibleReviews.map((rev) => (
            <div className="review-card-modern" key={rev.id}>
              <div
                className="stars-wrapper"
                aria-label={`${rev.rating} de 5 estrellas`}
              >
                {[...Array(5)].map((_, index) => (
                  <i
                    key={index}
                    className={`fa-solid fa-star star-icon${
                      index < rev.rating ? "" : " is-off"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <div className="client-details-top">
                <h4 className="client-name-modern">{rev.clientName}</h4>
                {/* Etiqueta del producto eliminada */}
              </div>

              <p className="review-comment-modern">
                {rev.comment}
              </p>
            </div>
          ));
        })()}
      </div>

      <button
        className="review-arrow-btn btn-right-modern"
        onClick={nextReview}
        aria-label="Reseña siguiente"
        disabled={total < 2}
      >
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </div>

    {/* Bloque de indicadores inferiores eliminado por completo */}

    <Link to="/reseñas" className="reviews-more-link">
      Ver todas las reseñas
      <i className="fa-solid fa-arrow-right" aria-hidden="true" />
    </Link>
  </section>
)}

        {/* ============ PREGUNTAS FRECUENTES (al final) ============ */}
        <FaqSection />
      </div>
    </div>
  );
}
