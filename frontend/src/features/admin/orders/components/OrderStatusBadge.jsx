// src/features/admin/orders/components/OrderStatusBadge.jsx
import React from "react";
import { getStatusMeta } from "../data/orderStatus";
import "./OrderStatusBadge.css";

export default function OrderStatusBadge({ status, onClick, title }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className="order-status-badge"
      onClick={onClick}
      title={title || "Haz clic para cambiar estado"}
      style={{ 
        color: meta.color, 
        backgroundColor: `${meta.color}1F`,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none"
      }}
    >
      {meta.label}
    </span>
  );
}