// src/shared/utils/imageUrl.js
// Resuelve la ruta de una imagen guardada en la base de datos.
//
// En las rutas de imágenes de producto conviven dos tipos:
//   - "/uploads/..." -> las sube el panel y las sirve el BACKEND.
//   - "/img/..."     -> assets que viven en el FRONT (catálogo inicial).
//   - URLs absolutas -> se respetan tal cual.
//
// El navegador resuelve las rutas relativas contra el origen del front, por eso
// solo hay que anteponer el origen del backend a las de /uploads.

import { API_URL } from "../api/client";

/** Origen del backend sin el prefijo /api (ej. "http://localhost:4000"). */
const BACKEND_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/?$/, "");
  }
})();

/**
 * @param {string} [ruta]
 * @returns {string} URL lista para un <img src>.
 */
export function imageUrl(ruta) {
  if (!ruta) return "";
  if (/^(https?:)?\/\//i.test(ruta) || ruta.startsWith("data:")) return ruta;
  if (ruta.startsWith("/uploads/")) return `${BACKEND_ORIGIN}${ruta}`;
  return ruta;
}

export default imageUrl;
