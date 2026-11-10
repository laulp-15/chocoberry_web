// src/features/admin/categories/services/categoryService.js
//
// Llamadas reales al backend para el módulo de categorías del panel
// administrador (/api/categorias). Solo esta capa conoce esas rutas.

import { api } from '../../../../shared/api/client';
import {
  mapCategoriaAdmin,
  mapCategoriasAdmin,
  mapGuardarError,
  toActualizarCategoriaPayload,
  toCrearCategoriaPayload,
} from './categoryMappers';

/** GET /categorias -> lista traducida al shape del panel. */
export async function listar() {
  const categorias = await api.get('/categorias');
  return mapCategoriasAdmin(categorias);
}

/** GET /categorias/:id */
export async function obtener(id) {
  const categoria = await api.get(`/categorias/${id}`);
  return mapCategoriaAdmin(categoria);
}

/** POST /categorias */
export async function crear(datos) {
  try {
    const categoria = await api.post('/categorias', toCrearCategoriaPayload(datos));
    return mapCategoriaAdmin(categoria);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /categorias/:id */
export async function actualizar(id, datos) {
  try {
    const categoria = await api.put(
      `/categorias/${id}`,
      toActualizarCategoriaPayload(datos)
    );
    return mapCategoriaAdmin(categoria);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /categorias/:id/estado */
export async function cambiarEstado(id, estado) {
  const categoria = await api.patch(`/categorias/${id}/estado`, { estado });
  return mapCategoriaAdmin(categoria);
}

/**
 * DELETE /categorias/:id.
 * El backend rechaza (409) si la categoría tiene productos asociados; el
 * mensaje se propaga tal cual para mostrarlo en la UI.
 */
export async function eliminar(id) {
  await api.del(`/categorias/${id}`);
}
