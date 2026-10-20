// src/features/admin/sales/services/saleService.js
//
// Llamadas reales al backend de ventas (/api/ventas). Ventas es una vista de
// solo lectura de pedidos confirmados; no hay endpoints de creación/edición.
import { api } from "../../../../shared/api/client";
import { mapVentaAdmin, mapVentasAdmin } from "./saleMappers";

function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, String(valor));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** GET /ventas -> pedidos en preparación, despachados, entregados o cancelados. */
export async function listar(filtros = {}) {
  const ventas = await api.get(`/ventas${construirQuery(filtros)}`);
  return mapVentasAdmin(ventas);
}

/** GET /ventas/:id */
export async function obtener(id) {
  const venta = await api.get(`/ventas/${id}`);
  return mapVentaAdmin(venta);
}
