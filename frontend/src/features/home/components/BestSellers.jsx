// src/features/home/components/BestSellers.jsx
// "Los más vendidos": ranking real del backend, máximo 4 productos activos.

import { useNavigate } from "react-router-dom";
import ProductCard from "../../catalog/components/ProductCard";
import { BEST_SELLER_COUNT } from "../data/homeContent";
import "./BestSellers.css";

export default function BestSellers({ productos, minPrice, loading, error }) {
  const navigate = useNavigate();

  if (error) return null;

  const items = productos.slice(0, BEST_SELLER_COUNT);

  if (!loading && items.length === 0) return null;

  return (
    <section className="best-sellers">
      <div className="home-head" data-reveal>
        <h2 className="home-title">Los más vendidos</h2>
       
      </div>

      <div className="best-sellers__grid">
        {loading
          ? Array.from({ length: BEST_SELLER_COUNT }, (_, i) => (
              <div key={i} className="best-sellers__skeleton" />
            ))
          : items.map((product, index) => (
              <div
                key={product.id}
                className="best-sellers__item"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="best-sellers__rank" aria-label={`Puesto ${index + 1}`}>
                  {index + 1}
                </span>
                <ProductCard
                  product={product}
                  minPrice={minPrice}
                  onViewDetail={(item) => navigate(`/productos/${item.id}`)}
                />
              </div>
            ))}
      </div>
    </section>
  );
}
