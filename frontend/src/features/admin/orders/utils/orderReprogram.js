// src/features/admin/orders/utils/orderReprogram.js
import { addDaysISO } from "../../../../shared/components/DatePicker";

export const REPROGRAM_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/** Fechas permitidas: mañana y pasado mañana, en formato ISO. */
export function getReprogramDateOptions() {
  return [
    { value: addDaysISO(1), label: "Mañana" },
    { value: addDaysISO(2), label: "Pasado mañana" },
  ];
}

/** Un pedido cancelado se puede reprogramar dentro de las 48 horas. */
export function canReprogramOrder(order) {
  if (!order || order.estado !== "cancelado" || !order.fechaCancelacion) {
    return false;
  }

  const cancelacion = new Date(order.fechaCancelacion);
  if (Number.isNaN(cancelacion.getTime())) return false;

  return Date.now() - cancelacion.getTime() <= REPROGRAM_WINDOW_MS;
}
