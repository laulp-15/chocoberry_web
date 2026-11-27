// src/shared/utils/orderRules.js
//
// Reglas compartidas entre carrito, checkout y panel de pedidos. Las reglas de
// fecha y cotización deben mantenerse alineadas con
// backend/src/config/capacidad.js.

export const MAX_CART_UNITS = 20;
export const MAX_MENSAJE_TARJETA = 255;
export const CONTACT_PHONE = "317 217 5887";
export const CONTACT_MESSAGE = `Si quieres un pedido más grande puedes contactarte al teléfono: ${CONTACT_PHONE}.`;

export const UMBRAL_COTIZACION_FRESAS = 200;
export const MAX_DIAS_ENTREGA = 20;
export const ANTICIPACION_POR_FRESAS = [
  { hasta: 40, dias: 2 },
  { hasta: 150, dias: 10 },
  { hasta: Infinity, dias: 15 },
];

/**
 * Unidades de una línea. El carrito usa `units` y el panel `unidades`;
 * se aceptan ambos para poder compartir los cálculos.
 */
function unidadesDe(item) {
  const valor = Number(item?.units ?? item?.unidades ?? 0);
  return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : 0;
}

/**
 * Fresas por unidad. El carrito las guarda en `quantity`; las líneas del panel
 * las exponen como `cantidadFresas`.
 */
function fresasPorUnidad(item) {
  const valor = Number(
    item?.quantity ??
      item?.cantidadFresas ??
      item?.presentacion?.cantidadFresas ??
      0
  );
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

/** Suma todas las unidades del pedido, sin importar producto ni presentación. */
export function totalUnidades(items = []) {
  return items.reduce((total, item) => total + unidadesDe(item), 0);
}

/** Fresas totales del pedido: fresas por unidad × unidades de cada línea. */
export function totalFresas(items = []) {
  return items.reduce(
    (total, item) => total + fresasPorUnidad(item) * unidadesDe(item),
    0
  );
}

/** El pedido de la tienda solo puede llegar a 20 unidades en total. */
export function excedeLimiteCarrito(items = []) {
  return totalUnidades(items) > MAX_CART_UNITS;
}

/** Mensaje que se muestra al superar el máximo del carrito. */
export function mensajeLimiteCarrito() {
  return CONTACT_MESSAGE;
}

/** Días mínimos de anticipación según las fresas totales del pedido. */
export function diasAnticipacionParaFresas(fresas) {
  const total = Number(fresas) || 0;
  const tramo = ANTICIPACION_POR_FRESAS.find(({ hasta }) => total <= hasta);
  return tramo ? tramo.dias : ANTICIPACION_POR_FRESAS.at(-1).dias;
}

/** Un pedido de cliente supera el máximo en línea y requiere cotización. */
export function requiereCotizacion(items = []) {
  return totalFresas(items) > UMBRAL_COTIZACION_FRESAS;
}

/** Cuenta caracteres visibles ignorando los espacios en blanco. */
export function contarCaracteresSinEspacios(texto) {
  return Array.from(String(texto ?? "").replace(/\s/g, "")).length;
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

/** Fecha mínima de entrega en ISO según las fresas del pedido. */
export function fechaMinimaEntrega(items = []) {
  return sumarDiasISO(diasAnticipacionParaFresas(totalFresas(items)));
}

/** Última fecha de entrega permitida por el backend. */
export function fechaMaximaEntrega() {
  return sumarDiasISO(MAX_DIAS_ENTREGA);
}

/** ISO (YYYY-MM-DD) -> DD/MM/YYYY para los mensajes de validación. */
export function formatearFechaISO(iso) {
  const [anio, mes, dia] = String(iso ?? "").split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : "";
}

export function mensajeFechaMinima(items, minima = fechaMinimaEntrega(items)) {
  return `Para un pedido de ${totalFresas(
    items
  )} fresas, la entrega más próxima es el ${formatearFechaISO(minima)}.`;
}

export function mensajeFechaMaxima(maxima = fechaMaximaEntrega()) {
  return `La fecha máxima de entrega es el ${formatearFechaISO(maxima)}.`;
}

export function mensajeRangoEntrega(
  items,
  minima = fechaMinimaEntrega(items),
  maxima = fechaMaximaEntrega()
) {
  return `Para un pedido de ${totalFresas(
    items
  )} fresas, la entrega más próxima es el ${formatearFechaISO(
    minima
  )}. Puedes programar hasta el ${formatearFechaISO(maxima)}.`;
}

export function mensajeCotizacion(items = []) {
  return `El pedido tiene ${totalFresas(
    items
  )} fresas y supera el máximo en línea de ${UMBRAL_COTIZACION_FRESAS}. Requiere cotización con la administradora. Puedes contactarte al teléfono: ${CONTACT_PHONE}.`;
}
