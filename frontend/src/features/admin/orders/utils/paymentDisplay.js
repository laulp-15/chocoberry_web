// src/features/admin/orders/utils/paymentDisplay.js
// Etiquetas, colores y estado de pago derivados de los comprobantes.

export const RECEIPT_STATUS_META = {
  Pendiente: {
    label: "Pendiente de revisión",
    color: "#B45309",
    background: "#F59E0B1F",
  },
  Aprobado: {
    label: "Aprobado",
    color: "#1B5E3F",
    background: "#E7F7EE",
  },
  Devuelto: {
    label: "Devuelto",
    color: "#9F1239",
    background: "#FFF1F2",
  },
};

export function getReceiptStatusMeta(estado) {
  return RECEIPT_STATUS_META[estado] ?? RECEIPT_STATUS_META.Pendiente;
}

export function getPaymentStatus(total, totalPagado) {
  const totalPedido = Number(total ?? 0);
  const pagado = Number(totalPagado ?? 0);

  if (pagado <= 0) {
    return { label: "Sin pago", tone: "none" };
  }

  if (pagado >= totalPedido) {
    return { label: "Pago completo", tone: "complete" };
  }

  return { label: "Pago parcial", tone: "partial" };
}

export function getReceiptAmountLabel(estado) {
  if (estado === "Aprobado") return "Monto aprobado";
  return "Monto";
}

export function getReceiptAmountText(comprobante) {
  if (comprobante.monto !== null && comprobante.monto !== undefined) {
    return comprobante.monto;
  }

  return comprobante.estado === "Pendiente" ? "Sin verificar" : "—";
}
