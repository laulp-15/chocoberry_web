// src/features/admin/presentations/services/presentationService.js
//
// Llamadas reales al backend para el módulo de presentaciones del panel
// administrador (/api/presentaciones). Solo esta capa conoce esas rutas.

import { api } from '../../../../shared/api/client';
import {
  mapGuardarError,
  mapPresentacionAdmin,
  mapPresentacionesAdmin,
  toActualizarPresentacionPayload,
  toCrearPresentacionPayload,
} from './presentationMappers';

/** GET /presentaciones -> lista traducida al shape del panel. */
export async function listar() {
  const presentaciones = await api.get('/presentaciones');
  return mapPresentacionesAdmin(presentaciones);
}

/** GET /presentaciones/:id */
export async function obtener(id) {
  const presentacion = await api.get(`/presentaciones/${id}`);
  return mapPresentacionAdmin(presentacion);
}

/** POST /presentaciones */
export async function crear(datos) {
  try {
    const presentacion = await api.post(
      '/presentaciones',
      toCrearPresentacionPayload(datos)
    );
    return mapPresentacionAdmin(presentacion);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /presentaciones/:id */
export async function actualizar(id, datos) {
  try {
    const presentacion = await api.put(
      `/presentaciones/${id}`,
      toActualizarPresentacionPayload(datos)
    );
    return mapPresentacionAdmin(presentacion);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /presentaciones/:id/estado */
export async function cambiarEstado(id, estado) {
  const presentacion = await api.patch(`/presentaciones/${id}/estado`, { estado });
  return mapPresentacionAdmin(presentacion);
}

/** DELETE /presentaciones/:id (el backend rechaza con 409 si está en pedidos). */
export async function eliminar(id) {
  await api.del(`/presentaciones/${id}`);
}
