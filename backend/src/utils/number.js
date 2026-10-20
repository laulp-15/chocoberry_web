// src/utils/number.js
// Helpers numéricos compartidos (los DECIMAL de MySQL llegan como texto).

/** Redondea a 2 decimales (precios en pesos colombianos). */
export function redondear2(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

export default redondear2;
