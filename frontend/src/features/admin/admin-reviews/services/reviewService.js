// src/features/admin/admin-reviews/services/reviewService.js
//
// Reseñas del panel: listado completo y cambio de estado. Solo el rol
// Administrador puede acceder a estas rutas.

import { api } from "../../../../shared/api/client";
import { mapResenaAdmin, mapResenasAdmin } from "./reviewMappers";

export async function listar() {
  const resenas = await api.get("/resenas");
  return mapResenasAdmin(resenas);
}

export async function cambiarEstado(id, estado) {
  const resena = await api.patch(`/resenas/${id}/estado`, { estado });
  return mapResenaAdmin(resena);
}
