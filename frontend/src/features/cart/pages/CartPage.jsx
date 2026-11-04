// src/features/cart/pages/CartPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../hooks/UseCart";
import CartItemCard from "../components/CartItemCard";
import CartSummary from "../components/CartSummary";
import CartNotification from "../components/CartNotification";
import ConfirmModal from "../../../shared/components/ConfirmModal";
import {
  MAX_CART_UNITS,
  excedeLimiteCarrito,
  totalUnidades,
} from "../../../shared/utils/orderRules";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, removeItem, updateUnits, updateField, clearCart } = useCart();
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [mergedNotificationOpen, setMergedNotificationOpen] = useState(
    () => Boolean(location.state?.merged)
  );

  useEffect(() => {
    if (!location.state?.merged) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const handleCheckout = () => {
    if (excedeLimiteCarrito(items)) return;
    navigate("/carrito/pago");
  };

  const puedeAumentar = totalUnidades(items) < MAX_CART_UNITS;

  const handleConfirmClear = () => {
    clearCart();
    setClearModalOpen(false);
  };

  const cantidadProductos = items.length;

  return (
    <div className="cart-page">
      <div className="container cart-wrap">
        {cantidadProductos > 0 && (
          <header className="cart-header">
            <div className="cart-heading-row">
              <span className="cart-icon" aria-hidden="true">
                <i className="fa-solid fa-cart-shopping" />
              </span>
              <h1 className="cart-title">Tu Carrito</h1>
            </div>
            <span className="cart-title-line" aria-hidden="true" />
          </header>
        )}

        {cantidadProductos === 0 ? (
          <div className="cart-empty">
            <i className="fa-solid fa-cart-plus" />

            <h2>Tu carrito está vacío</h2>

            <p>
              Aún no has agregado productos a tu carrito.
              Explora nuestro catálogo y encuentra algo delicioso.
            </p>

            <button
              type="button"
              className="cart-empty-link"
              onClick={() => navigate("/productos")}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="row">
            <div className="col-12 col-lg-8">
              {items.map((item) => (
                <CartItemCard
                  key={item.cartItemId}
                  item={item}
                  onUnitsChange={updateUnits}
                  onFieldChange={updateField}
                  onRemove={removeItem}
                  canIncrease={puedeAumentar}
                />
              ))}
            </div>
            <div className="col-12 col-lg-4">
              <CartSummary items={items} onCheckout={handleCheckout} />

              <div className="cart-side-actions">
                <button
                  type="button"
                  className="btn-back-catalog"
                  onClick={() => navigate("/productos")}
                >
                  <i className="fa-solid fa-arrow-left-long" />
                  Volver al catálogo
                </button>
                <button
                  type="button"
                  className="btn-clear-cart"
                  onClick={() => setClearModalOpen(true)}
                >
                  <i className="fa-solid fa-trash" />
                  Vaciar carrito
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        variant="warning"
        title="Vaciar carrito"
        description="Vas a eliminar todos los productos de tu carrito. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar"
      />

      <CartNotification
        open={mergedNotificationOpen}
        onClose={() => setMergedNotificationOpen(false)}
        message="El producto ya estaba en el carrito. Se ha añadido una cantidad más."
      />
    </div>
  );
}