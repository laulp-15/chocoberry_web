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

/** GET /productos -> lista traducida al shape del panel. */
export async function listar() {
  const productos = await api.get("/productos");
  return mapProductosAdmin(productos);
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
