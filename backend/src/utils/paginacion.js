// src/utils/paginacion.js
// Utilidades para listados paginados de forma opcional. Si la petición no
// incluye `page` ni `limit`, el listado conserva su comportamiento anterior.

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;

/**
 * Lee y normaliza la paginación de una query ya validada.
 * @param {{ page?: number, limit?: number }} query
 */
export function leerPaginacion(query = {}) {
  const paginado = query.page !== undefined || query.limit !== undefined;

  if (!paginado) {
    return { paginado: false, page: null, limit: null, offset: 0 };
  }

  const page = Number(query.page ?? PAGE_DEFAULT);
  const limit = Number(query.limit ?? LIMIT_DEFAULT);

  return {
    paginado: true,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

/** Construye la metadata pública de un listado paginado. */
export function construirMeta({ total, page, limit }) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
