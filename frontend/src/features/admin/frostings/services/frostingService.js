// src/features/admin/frostings/services/frostingService.js
//
// Llamadas reales al backend para el módulo de glaseados del panel
// administrador (/api/glaseados). Solo esta capa conoce esas rutas.

import { api } from '../../../../shared/api/client';
import {
  mapFrostingAdmin,
  mapFrostingsAdmin,
  mapGuardarError,
  toActualizarFrostingPayload,
  toCrearFrostingPayload,
} from './frostingMappers';

/** GET /glaseados -> lista traducida al shape del panel. */
export async function listar() {
  const glaseados = await api.get('/glaseados');
  return mapFrostingsAdmin(glaseados);
}

/** GET /glaseados/:id */
export async function obtener(id) {
  const glaseado = await api.get(`/glaseados/${id}`);
  return mapFrostingAdmin(glaseado);
}

/** POST /glaseados */
export async function crear(datos) {
  try {
    const glaseado = await api.post(
      '/glaseados',
      toCrearFrostingPayload(datos)
    );
    return mapFrostingAdmin(glaseado);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /glaseados/:id */
export async function actualizar(id, datos) {
  try {
    const glaseado = await api.put(
      `/glaseados/${id}`,
      toActualizarFrostingPayload(datos)
    );
    return mapFrostingAdmin(glaseado);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /glaseados/:id/estado */
export async function cambiarEstado(id, estado) {
  const glaseado = await api.patch(`/glaseados/${id}/estado`, { estado });
  return mapFrostingAdmin(glaseado);
}

/** DELETE /glaseados/:id (el backend rechaza con 409 si está en pedidos). */
export async function eliminar(id) {
  await api.del(`/glaseados/${id}`);
}
