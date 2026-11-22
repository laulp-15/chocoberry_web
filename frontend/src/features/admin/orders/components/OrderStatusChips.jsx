// src/features/admin/orders/components/OrderStatusChips.jsx
import { ORDER_STATUSES } from "../data/orderStatus";
import "./OrderStatusChips.css";

function chipStyle(status) {
  return {
    "--chip-color": status.color,
    "--chip-soft": `${status.color}1A`,
    "--chip-border": `${status.color}59`,
    "--chip-shadow": `${status.color}55`,
    "--chip-active-bg": status.color,
    "--chip-active-text": "#FFFFFF",
    "--chip-active-count-bg": "rgba(255, 255, 255, 0.24)",
  };
}

export default function OrderStatusChips({
  activeStatus,
  onChange,
  counts = {},
}) {
  return (
    <div
      className="order-status-chips"
      role="group"
      aria-label="Filtrar pedidos por estado"
    >
      <button
        type="button"
        className={`order-status-chip order-status-chip--all ${
          activeStatus === "todos" ? "active" : ""
        }`}
        aria-pressed={activeStatus === "todos"}
        onClick={() => onChange("todos")}
      >
        Todos
      </button>

      <span className="order-status-chips-divider" aria-hidden="true" />

      {ORDER_STATUSES.map((status) => {
        const isActive = activeStatus === status.value;
        const count = counts[status.value];
        const hasCount = typeof count === "number";

        return (
          <button
            key={status.value}
            type="button"
            className={`order-status-chip ${isActive ? "active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(status.value)}
            style={chipStyle(status)}
          >
            {status.label}
            {hasCount && (
              <span className="order-status-chip-count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}