// src/features/admin/presentaciones/utils/presentacionDisplay.js

/**
 * Texto de la cantidad de fresas de una presentación.
 * @param {number} cantidad
 * @returns {string} ej: "12 fresas"
 */
export function labelCantidad(cantidad) {
  return cantidad === 1 ? '1 fresa' : `${cantidad} fresas`;
}
