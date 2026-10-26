// src/shared/utils/orderRules.js
//
// Reglas compartidas entre carrito, checkout y panel de pedidos:
// - El pedido de la tienda no puede superar 20 unidades en total.
// - A partir de 11 unidades en total, la entrega no puede ser para mañana.
// - El panel queda exento del tope total para registrar pedidos telefónicos.

export const MAX_CART_UNITS = 20;
export const LARGE_ORDER_UNITS = 10;
export const CONTACT_PHONE = "317 217 5887";
export const CONTACT_MESSAGE = `Si quieres un pedido más grande puedes contactarte al teléfono: ${CONTACT_PHONE}.`;

/**
 * Unidades de una línea. El carrito usa `units` y el panel `unidades`;
 * se aceptan ambos para poder compartir los cálculos.
 */
function unidadesDe(item) {
  const valor = Number(item?.units ?? item?.unidades ?? 0);
  return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : 0;
}

/** Suma todas las unidades del pedido, sin importar producto ni presentación. */
export function totalUnidades(items = []) {
  return items.reduce((total, item) => total + unidadesDe(item), 0);
}

/** El pedido de la tienda solo puede llegar a 20 unidades en total. */
export function excedeLimiteCarrito(items = []) {
  return totalUnidades(items) > MAX_CART_UNITS;
}

/** Más de 10 unidades en total: la entrega se corre a pasado mañana. */
export function esPedidoGrande(items = []) {
  return totalUnidades(items) > LARGE_ORDER_UNITS;
}

/** Mensaje que se muestra al superar el máximo del carrito. */
export function mensajeLimiteCarrito() {
  return CONTACT_MESSAGE;
}

/** Normaliza lo escrito en el input: entero >= 1 (0 o vacío -> 1). */
export function normalizarCantidad(valor) {
  const numero = Number.parseInt(String(valor ?? "").trim(), 10);
  return Number.isFinite(numero) && numero > 0 ? numero : 1;
}

/** Fecha de hoy + N días en ISO local (YYYY-MM-DD). */
function sumarDiasISO(dias) {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/**
 * Fecha mínima de entrega en ISO: mañana normalmente y pasado mañana
 * cuando el pedido supera las 10 unidades en total.
 */
export function fechaMinimaEntrega(items = []) {
  return sumarDiasISO(esPedidoGrande(items) ? 2 : 1);
}

/** ISO (YYYY-MM-DD) -> DD/MM/YYYY para los mensajes de validación. */
export function formatearFechaISO(iso) {
  const [anio, mes, dia] = String(iso ?? "").split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : "";
}
