// src/features/home/components/HomeCatalog.jsx
//
// Carrusel horizontal de productos (máx. 12) que responde a la barra de
// categorías. El listado completo vive en la pestaña "Catálogo" (/productos).

import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../../catalog/components/ProductCard";
import ScrollRail from "./ScrollRail";
import { CATALOG_CAROUSEL_LIMIT } from "../data/homeContent";
import "./HomeCatalog.css";

export default function HomeCatalog({
  productos,
  categorias,
  activeCategory,
  minPrice,
  loading,
  error,
  reload,
}) {
  const navigate = useNavigate();

  const filtered =
    activeCategory === "todas"
      ? productos
      : productos.filter((producto) => producto.cat === activeCategory);
  const visible = filtered.slice(0, CATALOG_CAROUSEL_LIMIT);
  const activeLabel =
    categorias.find((cat) => cat.value === activeCategory)?.label ?? "Todas";

  const renderBody = () => {
    if (error) {
      return (
        <div className="home-catalog__state" role="alert">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <p>{error}</p>
          <button type="button" className="home-catalog__retry" onClick={reload}>
            Reintentar
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <ScrollRail label="Cargando productos">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="home-catalog__skeleton" />
          ))}
        </ScrollRail>
      );
    }

    if (visible.length === 0) {
      return (
        <div className="home-catalog__state">
          <i className="fa-solid fa-box-open" aria-hidden="true" />
          <p>Todavía no hay productos en esta categoría.</p>
        </div>
      );
    }

    // key: al cambiar de categoría la fila se reinicia (vuelve al inicio y
    // las tarjetas entran una tras otra)
    return (
      <ScrollRail key={activeCategory} label={`Productos de ${activeLabel}`}>
        {visible.map((product, index) => (
          <div
            key={product.id}
            className="home-catalog__item"
            style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
          >
            <ProductCard
              product={product}
              minPrice={minPrice}
              onViewDetail={(item) => navigate(`/productos/${item.id}`)}
            />
          </div>
        ))}
      </ScrollRail>
    );
  };

  return (
    <section id="catalogo" className="home-catalog">
      

      {renderBody()}

      {!error && !loading && filtered.length > 0 && (
        <div className="home-catalog__footer">
          <span className="home-catalog__count">
            {visible.length < filtered.length
              ? `Mostrando ${visible.length} de ${filtered.length} productos`
              : `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`}
          </span>
          <Link to="/productos" className="home-catalog__all">
            Ver más <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
