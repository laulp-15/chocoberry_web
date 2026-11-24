// src/features/admin/municipalities/services/municipalityService.js
//
// Llamadas reales al backend para el módulo de municipios del panel
// administrador (/api/municipios). Solo esta capa conoce esas rutas.

import { api } from '../../../../shared/api/client';
import {
  mapGuardarError,
  mapMunicipioAdmin,
  mapMunicipiosAdmin,
  toActualizarMunicipioPayload,
  toCrearMunicipioPayload,
} from './municipalityMappers';

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
 * GET /municipios -> lista traducida al shape del panel. Con `page`/`limit`
 * el backend responde `{ data, meta }`; sin ellos conserva el array completo.
 */
export async function listar(filtros = {}) {
  const respuesta = await api.get(`/municipios${construirQuery(filtros)}`);

  if (Array.isArray(respuesta)) {
    return mapMunicipiosAdmin(respuesta);
  }

  return {
    data: mapMunicipiosAdmin(respuesta?.data ?? []),
    meta: respuesta?.meta ?? null,
  };
}

/** GET /municipios/:id */
export async function obtener(id) {
  const municipio = await api.get(`/municipios/${id}`);
  return mapMunicipioAdmin(municipio);
}

/** POST /municipios */
export async function crear(datos) {
  try {
    const municipio = await api.post(
      '/municipios',
      toCrearMunicipioPayload(datos)
    );
    return mapMunicipioAdmin(municipio);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /municipios/:id */
export async function actualizar(id, datos) {
  try {
    const municipio = await api.put(
      `/municipios/${id}`,
      toActualizarMunicipioPayload(datos)
    );
    return mapMunicipioAdmin(municipio);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /municipios/:id/estado */
export async function cambiarEstado(id, estado) {
  const municipio = await api.patch(`/municipios/${id}/estado`, { estado });
  return mapMunicipioAdmin(municipio);
}

/** DELETE /municipios/:id (el backend rechaza con 409 si tiene pedidos). */
export async function eliminar(id) {
  await api.del(`/municipios/${id}`);
}
