// src/features/admin/roles/services/roleService.js
// Llamadas reales al backend para roles y su catálogo de permisos.

import { api } from "../../../../shared/api/client";
import {
  mapPermisoFromApi,
  mapRolFromApi,
  toRolPayload,
} from "./roleMappers";

export async function listarRoles(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, String(valor));
    }
  });

  const query = params.toString();
  const respuesta = await api.get(`/roles${query ? `?${query}` : ""}`);

  if (Array.isArray(respuesta)) return respuesta.map((rol) => mapRolFromApi(rol));

  return {
    data: (respuesta?.data ?? []).map((rol) => mapRolFromApi(rol)),
    meta: respuesta?.meta ?? null,
  };
}

export async function listarPermisos() {
  const permisos = await api.get("/permisos");
  return permisos.map(mapPermisoFromApi);
}

export async function obtenerPermisosDeRol(id) {
  const permisos = await api.get(`/roles/${id}/permisos`);
  return permisos.map(mapPermisoFromApi);
}

export async function crearRol(datos) {
  const rol = await api.post("/roles", toRolPayload(datos));
  return mapRolFromApi(rol, datos.permissionIds);
}

export async function actualizarRol(id, datos) {
  const rol = await api.put(`/roles/${id}`, toRolPayload(datos));
  return mapRolFromApi(rol, datos.permissionIds);
}

export async function eliminarRol(id) {
  await api.del(`/roles/${id}`);
}
