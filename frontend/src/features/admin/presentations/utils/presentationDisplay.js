// src/features/admin/presentations/utils/presentationDisplay.js

/**
 * Texto de la cantidad de fresas de una presentación.
 * @param {number} cantidad
 * @returns {string} ej: "12 fresas"
 */
export function quantityLabel(cantidad) {
  return cantidad === 1 ? '1 fresa' : `${cantidad} fresas`;
}
