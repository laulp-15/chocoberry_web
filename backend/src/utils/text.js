// src/utils/text.js
// Helpers de texto reutilizables.

/**
 * Convierte un texto a slug: "Administrador" -> "administrador",
 * "La Estrella" -> "la-estrella" (sin tildes, minúsculas, con guiones).
 */
export function slugify(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
