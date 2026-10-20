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

/** GET /municipios -> lista traducida al shape del panel. */
export async function listar() {
  const municipios = await api.get('/municipios');
  return mapMunicipiosAdmin(municipios);
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
