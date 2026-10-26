// src/features/cart/components/CartSummary.jsx
import { Button } from "@mui/material";
import { formatPrice } from "../../../shared/utils/formatPrice";
import {
  excedeLimiteCarrito,
  mensajeLimiteCarrito,
} from "../../../shared/utils/orderRules";
import "./CartSummary.css";

/**
 * @param {object} props
 * @param {object[]} props.items - items del carrito (ver useCart)
 * @param {() => void} [props.onCheckout]
 */
export default function CartSummary({ items, onCheckout }) {
  const lines = items.map((it) => ({
    cartItemId: it.cartItemId,
    name: it.name,
    units: it.units,
    total: Number(it.unitPrice ?? 0) * it.units,
  }));

  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const excedeLimite = excedeLimiteCarrito(items);

  return (
    <div className="cart-summary">
      <h2 className="cart-summary-title">Resumen</h2>

      <div className="cart-summary-lines">
        {lines.map((line) => (
          <div key={line.cartItemId} className="cart-summary-line">
            <span className="cart-summary-line-name">
              {line.name} <span className="cart-summary-line-units">x{line.units}</span>
            </span>
            <span className="cart-summary-line-price">{formatPrice(line.total)}</span>
          </div>
        ))}
      </div>

      <hr className="cart-summary-divider" />

      <div className="cart-summary-row cart-summary-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {excedeLimite && (
        <div className="cart-summary-warning" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{mensajeLimiteCarrito()}</span>
        </div>
      )}

      <Button
        className="btn-checkout"
        variant="contained"
        disableRipple
        fullWidth
        disabled={excedeLimite}
        onClick={onCheckout}
      >
        Continuar compra
      </Button>
    </div>
  );
}