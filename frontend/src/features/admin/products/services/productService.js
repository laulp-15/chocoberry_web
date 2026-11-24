// src/features/admin/products/services/productService.js
//
// Llamadas reales al backend para el módulo de productos del panel
// administrador (/api/productos). Solo esta capa conoce esas rutas.

import { api } from "../../../../shared/api/client";
import {
  mapGuardarError,
  mapProductoAdmin,
  mapProductosAdmin,
  toActualizarProductoPayload,
  toCrearProductoPayload,
} from "./productMappers";

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

/**
 * GET /productos -> lista traducida al shape del panel. Con `page`/`limit`
 * el backend responde `{ data, meta }`; sin ellos conserva el array completo.
 */
export async function listar(filtros = {}) {
  const respuesta = await api.get(`/productos${construirQuery(filtros)}`);

  if (Array.isArray(respuesta)) {
    return mapProductosAdmin(respuesta);
  }

  return {
    data: mapProductosAdmin(respuesta?.data ?? []),
    meta: respuesta?.meta ?? null,
  };
}

/** GET /productos/:id */
export async function obtener(id) {
  const producto = await api.get(`/productos/${id}`);
  return mapProductoAdmin(producto);
}

/** POST /productos (multipart con la foto). */
export async function crear(datos) {
  try {
    const producto = await api.post("/productos", toCrearProductoPayload(datos));
    return mapProductoAdmin(producto);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /productos/:id */
export async function actualizar(id, datos) {
  try {
    const producto = await api.put(
      `/productos/${id}`,
      toActualizarProductoPayload(datos)
    );
    return mapProductoAdmin(producto);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /productos/:id/estado */
export async function cambiarEstado(id, estado) {
  const producto = await api.patch(`/productos/${id}/estado`, { estado });
  return mapProductoAdmin(producto);
}

/**
 * DELETE /productos/:id.
 * El backend rechaza (409) si el producto aparece en pedidos; el mensaje se
 * propaga tal cual para mostrarlo en la UI.
 */
export async function eliminar(id) {
  await api.del(`/productos/${id}`);
}
