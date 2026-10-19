// src/features/admin/orders/components/OrderStatusSelector.jsx
import React, { useState, useRef, useEffect } from "react";
import { ORDER_STATUSES, getStatusMeta } from "../data/orderStatus";
import "./OrderStatusBadge.css";

export default function OrderStatusSelector({ 
  status, 
  onChange, 
  disabled,
  lockedReason,
  canReject = true
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = getStatusMeta(status);

  const sequence = ["pendiente", "en_preparacion", "despachado", "rechazado", "entregado", "cancelado"];
  const currentIndex = sequence.indexOf(status);
  const validNext = currentIndex !== -1 
    ? sequence.slice(currentIndex + 1) 
    : [];

  // "Rechazado" solo está disponible para pedidos que se pueden rechazar
  // (ver regla de negocio en OrdersListPage).
  const options = !disabled 
    ? validNext.filter((value) => value !== "rechazado" || canReject)
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (options.length === 0) {
    return (
      <span className="order-status-badge" style={{ 
        color: meta.color, 
        backgroundColor: `${meta.color}1F`,
        cursor: "default"
      }} title={lockedReason}>
        {meta.label}
      </span>
    );
  }

  return (
    <div className="order-status-selector" ref={ref}>
      <span 
        className="order-status-badge"
        onClick={() => !disabled && setOpen(o => !o)}
        style={{ 
          color: meta.color, 
          backgroundColor: `${meta.color}1F`,
          cursor: disabled ? "default" : "pointer"
        }}
        title={disabled ? lockedReason : "Seleccionar estado"}
      >
        {meta.label}
        {!disabled && <i className="fa-solid fa-chevron-down" style={{ marginLeft: "4px", fontSize: "10px" }} />}
      </span>
      
      {open && (
        <div className="order-status-dropdown">
          {options.map((optValue) => {
            const opt = getStatusMeta(optValue);
            const isCurrent = optValue === status;
            return (
              <button
                key={optValue}
                type="button"
                className={`order-status-option ${isCurrent ? "current" : ""}`}
                onClick={() => { onChange(optValue); setOpen(false); }}
                disabled={isCurrent}
                style={{ 
                  color: opt.color,
                  opacity: isCurrent ? 0.5 : 1
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}