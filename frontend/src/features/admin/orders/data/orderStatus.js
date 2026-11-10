// src/features/admin/orders/data/orderStatus.js

export const ORDER_STATUSES = [
  { value: "pendiente", label: "Pendiente", color: "#F49505" },
  { value: "en_preparacion", label: "En preparación", color: "#1D77ED" },
  { value: "despachado", label: "Despachado", color: "#24943C" },
  { value: "rechazado", label: "Rechazado", color: "#DD322D" },
  { value: "entregado", label: "Entregado", color: "#2E8B57" },
  { value: "cancelado", label: "Cancelado", color: "#DD322D" },
];

/**
 * Transiciones reales del backend (/api/pedidos/:id/estado).
 * "Rechazado" se aplica por el endpoint de rechazo (exige motivo), no por
 * el cambio de estado normal.
 */
export const ORDER_STATUS_TRANSITIONS = {
  pendiente: ["en_preparacion", "rechazado"],
  en_preparacion: ["despachado"],
  despachado: ["entregado", "cancelado"],
  entregado: [],
  rechazado: [],
  cancelado: [],
};

export function getStatusMeta(value) {
  return ORDER_STATUSES.find((s) => s.value === value) ?? ORDER_STATUSES[0];
}

export function getNextStatuses(status) {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}

export function isFinalStatus(status) {
  return getNextStatuses(status).length === 0;
}
