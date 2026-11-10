// src/features/admin/roles/services/roleService.js
// Llamadas reales al backend para roles y su catálogo de permisos.

import { api } from "../../../../shared/api/client";
import {
  mapPermisoFromApi,
  mapRolFromApi,
  toRolPayload,
} from "./roleMappers";

export async function listarRoles() {
  const roles = await api.get("/roles");
  return roles.map((rol) => mapRolFromApi(rol));
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
