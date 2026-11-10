// src/features/catalog/components/ProductCard.jsx
import { Button } from "@mui/material";
import { formatPrice } from "../../../shared/utils/formatPrice";
import "./ProductCard.css";

/**
 * Tarjeta de producto.
 * El precio mostrado es el mínimo posible entre las presentaciones activas
 * (lo calcula el catálogo a partir de /api/catalogo/presentaciones); el precio
 * real se define en el detalle según la cantidad elegida.
 * La personalización (cantidad, color, mensajes) solo se hace desde el
 * detalle del producto, por eso esta tarjeta solo tiene "Ver Detalle".
 *
 * @param {object} props
 * @param {object} props.product - { name, catLabel, desc, image }
 * @param {number} [props.minPrice] - precio mínimo de las presentaciones.
 * @param {(product: object) => void} [props.onViewDetail]
 */
export default function ProductCard({ product, minPrice = 0, onViewDetail }) {
  const { name, catLabel, desc, image } = product;

  return (
    <div className="product-card">
      <div className="product-image">
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <i className="fa-solid fa-image" />
        )}
      </div>
      <div className="product-body">
        <div className="product-category">{catLabel}</div>
        <div className="product-name">{name}</div>
        <div className="product-desc">{desc}</div>
        {minPrice > 0 && (
          <div className="product-price">Desde {formatPrice(minPrice)}</div>
        )}
        <div className="product-actions">
          <Button
            className="btn-detail"
            variant="outlined"
            disableRipple
            fullWidth
            onClick={() => onViewDetail?.(product)}
          >
            Ver más
            <i className="fa-solid fa-arrow-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}