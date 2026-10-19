// src/features/catalog/pages/ProductCatalog.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import CategoryChips from "../components/CategoryChips";
import ProductCard from "../components/ProductCard";
import useCatalogo from "../hooks/useCatalogo";
import "./ProductCatalog.css";

export default function ProductCatalog() {
  const navigate = useNavigate();
  const { productos, categorias, minPrice, loading, error, reload } = useCatalogo();

  const [activeCategory, setActiveCategory] = useState("todas");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const texto = query.trim().toLowerCase();
  const filteredProducts = productos.filter((producto) => {
    const matchesCat =
      activeCategory === "todas" || producto.cat === activeCategory;
    const matchesQuery = producto.name.toLowerCase().includes(texto);
    return matchesCat && matchesQuery;
  });

  const handleViewDetail = (product) => {
    navigate(`/productos/${product.id}`);
  };

  return (
    <div className="catalog-page">

      <div className="catalog-hero">
        <div className="catalog-hero-overlay"></div>

        <div className="catalog-hero-inner">
          <span className="catalog-hero-tag">
            <i className="fa-solid fa-heart" aria-hidden="true"></i>
            Hecho para compartir
          </span>

          <h1 className="catalog-hero-title">
            Nuestros productos
          </h1>

          <p className="catalog-hero-subtitle">
            Descubre nuestras fresas cubiertas de chocolate,
            hechas a mano para convertir cada ocasión en un
            momento especial.
          </p>
        </div>
      </div>

      <div className="container catalog-wrap">
        <SearchBar
          value={query}
          onChange={setQuery}
          filterActive={filterOpen}
          onFilterClick={() => setFilterOpen((open) => !open)}
        />

        <CategoryChips
          categories={categorias}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />

        {error ? (
          <div className="empty-state">
            <i className="fa-solid fa-triangle-exclamation" />
            {error}
            <button type="button" className="catalog-retry" onClick={reload}>
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="empty-state">
            <i className="fa-solid fa-spinner fa-spin" />
            Cargando productos...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="row">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="col-12 col-sm-6 col-lg-3 product-col"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <ProductCard
                  product={product}
                  minPrice={minPrice}
                  onViewDetail={handleViewDetail}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fa-solid fa-magnifying-glass" />
            No encontramos productos con ese filtro.
          </div>
        )}
      </div>
    </div>
  );
}
