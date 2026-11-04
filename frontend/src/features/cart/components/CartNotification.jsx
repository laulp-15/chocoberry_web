// src/features/cart/components/CartNotification.jsx
import { useEffect } from "react";
import "./CartNotification.css";

const ICONS = {
  info: "fa-circle-exclamation",
  success: "fa-circle-check",
  warning: "fa-triangle-exclamation",
};

/**
 * Notificaci��n flotante del carrito (fusiones, éxito tras login y avisos de
 * sesión). Se cierra sola a los 6 segundos, o con la X.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.message
 * @param {"info" | "success" | "warning"} [props.variant]
 */
export default function CartNotification({
  open,
  onClose,
  message,
  variant = "info",
}) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`cart-notification cart-notification--${variant}`}
      role="status"
    >
      <div className="cart-notification-icon">
        <i className={`fa-solid ${ICONS[variant] ?? ICONS.info}`} />
      </div>
      <div className="cart-notification-body">
        <div className="cart-notification-message">{message}</div>
      </div>
      <button type="button" className="cart-notification-close" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}