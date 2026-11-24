// src/features/admin/admin-reviews/services/reviewService.js
//
// Reseñas del panel: listado completo y cambio de estado. El listado requiere
// "Ver Reseñas"; el cambio de estado requiere "Cambiar estado Reseñas".

import { api } from "../../../../shared/api/client";
import { mapResenaAdmin, mapResenasAdmin } from "./reviewMappers";

export async function listar(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, String(valor));
    }
  });

  const query = params.toString();
  const respuesta = await api.get(`/resenas${query ? `?${query}` : ""}`);

  if (Array.isArray(respuesta)) return mapResenasAdmin(respuesta);

  return {
    data: mapResenasAdmin(respuesta?.data),
    meta: respuesta?.meta ?? null,
  };
}

export async function cambiarEstado(id, estado) {
  const resena = await api.patch(`/resenas/${id}/estado`, { estado });
  return mapResenaAdmin(resena);
}
