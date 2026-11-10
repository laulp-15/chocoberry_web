// src/features/catalog/components/RelatedProducts.jsx
import ProductCard from "./ProductCard";
import "./RelatedProducts.css";

/**
 * Sección "También te podría gustar": reutiliza ProductCard del catálogo.
 *
 * @param {object} props
 * @param {object[]} props.products
 * @param {number} [props.minPrice]
 * @param {() => void} [props.onViewAll]
 * @param {(product: object) => void} [props.onViewDetail]
 */
export default function RelatedProducts({ products, minPrice = 0, onViewAll, onViewDetail }) {
  return (
    <div className="related-products">
      <div className="related-header">
        <h2 className="related-title">También te podría gustar</h2>
        <button type="button" className="related-view-all" onClick={onViewAll}>
          Ver todo
        </button>
      </div>
      <div className="row">
        {products.map((product) => (
          <div key={product.id} className="col-12 col-sm-6 col-lg-3 product-col">
            <ProductCard product={product} minPrice={minPrice} onViewDetail={onViewDetail} />
          </div>
        ))}
      </div>
    </div>
  );
}