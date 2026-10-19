// src/features/admin/users/services/userService.js
//
// Llamadas reales al backend para el módulo de usuarios del panel
// administrador. Solo esta capa conoce las rutas /api/usuarios; el hook
// (useUsersAdmin) y las páginas no cambian su forma de uso.

import { api } from "../../../../shared/api/client";
import {
  mapGuardarError,
  mapUsuarioAdmin,
  mapUsuariosAdmin,
  toActualizarUsuarioPayload,
  toCrearUsuarioPayload,
} from "./userMappers";

/** GET /usuarios -> lista de usuarios (ya traducida al shape del panel). */
export async function listar() {
  const usuarios = await api.get("/usuarios");
  return mapUsuariosAdmin(usuarios);
}

/** GET /usuarios/:id -> un usuario. */
export async function obtener(id) {
  const usuario = await api.get(`/usuarios/${id}`);
  return mapUsuarioAdmin(usuario);
}

/** POST /usuarios -> crea un usuario (empleado o cliente). */
export async function crear(datos) {
  try {
    const usuario = await api.post("/usuarios", toCrearUsuarioPayload(datos));
    return mapUsuarioAdmin(usuario);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PUT /usuarios/:id -> actualiza un usuario (contraseña opcional). */
export async function actualizar(id, datos) {
  try {
    const usuario = await api.put(`/usuarios/${id}`, toActualizarUsuarioPayload(datos));
    return mapUsuarioAdmin(usuario);
  } catch (error) {
    throw mapGuardarError(error);
  }
}

/** PATCH /usuarios/:id/estado -> activa o desactiva un usuario. */
export async function cambiarEstado(id, estado) {
  const usuario = await api.patch(`/usuarios/${id}/estado`, { estado });
  return mapUsuarioAdmin(usuario);
}

/**
 * DELETE /usuarios/:id.
 * El backend rechaza (409) la eliminación si el usuario tiene pedidos
 * asociados; el mensaje se propaga tal cual para mostrarlo en la UI.
 */
export async function eliminar(id) {
  await api.del(`/usuarios/${id}`);
}
