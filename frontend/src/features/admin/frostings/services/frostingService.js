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

function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * GET /glaseados -> lista traducida al shape del panel. Con `page`/`limit`
 * el backend responde `{ data, meta }`; sin ellos conserva el array completo.
 */
export async function listar(filtros = {}) {
  const respuesta = await api.get(`/glaseados${construirQuery(filtros)}`);

  if (Array.isArray(respuesta)) {
    return mapFrostingsAdmin(respuesta);
  }

  return {
    data: mapFrostingsAdmin(respuesta?.data ?? []),
    meta: respuesta?.meta ?? null,
  };
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
