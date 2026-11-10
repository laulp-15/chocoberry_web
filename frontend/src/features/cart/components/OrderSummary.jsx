// src/features/cart/components/OrderSummary.jsx
import { Button } from "@mui/material";
import { formatPrice } from "../../../shared/utils/formatPrice";
import "./OrderSummary.css";

/**
 * @param {object} props
 * @param {object[]} props.items - items del carrito (ver useCart)
 * @param {number} props.shippingCost
 * @param {() => void} props.onSubmit
 * @param {boolean} [props.submitting]
 */
export default function OrderSummary({ items, shippingCost, onSubmit, submitting = false }) {
  const lines = items.map((it) => ({
    cartItemId: it.cartItemId,
    name: it.name,
    image: it.image,
    quantity: it.quantity,
    units: it.units,
    total: Number(it.unitPrice ?? 0) * it.units,
  }));

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const total = subtotal + shippingCost;

  return (
    <div className="order-summary">
      <h2 className="order-summary-title">Resumen de Pedido</h2>

      <div className="order-summary-items">
        {lines.map((line) => (
          <div key={line.cartItemId} className="order-summary-item">
            <div className="order-summary-thumb">
              {line.image ? (
                <img src={line.image} alt={line.name} />
              ) : (
                <i className="fa-solid fa-image" />
              )}
            </div>
            <div className="order-summary-item-info">
              <div className="order-summary-item-name">{line.name}</div>
              <div className="order-summary-item-qty">
                {line.units} un. · {line.quantity} fresas
              </div>
            </div>
            <div className="order-summary-item-price">{formatPrice(line.total)}</div>
          </div>
        ))}
      </div>

      <hr className="order-summary-divider" />

      <div className="order-summary-row">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="order-summary-row">
        <span>Envío</span>
        <span>{shippingCost > 0 ? formatPrice(shippingCost) : "$0"}</span>
      </div>

      <hr className="order-summary-divider" />

      <div className="order-summary-row order-summary-total">
        <span>Total general</span>
        <span>{formatPrice(total)}</span>
      </div>

      <Button
        className="btn-finish-order"
        variant="contained"
        disableRipple
        fullWidth
        onClick={onSubmit}
        disabled={submitting}
        endIcon={<i className="fa-solid fa-arrow-right-long" />}
      >
        {submitting ? "Enviando pedido..." : "Finalizar pedido"}
      </Button>
    </div>
  );
}