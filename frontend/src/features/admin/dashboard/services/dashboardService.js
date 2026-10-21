// src/features/admin/dashboard/services/dashboardService.js
//
// Llamada real al resumen del Dashboard. El backend ya devuelve los datos
// agregados y listos para las gráficas; aquí solo se construye la query.
import { api } from "../../../../shared/api/client";

function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, String(valor));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** GET /dashboard/resumen?semana=YYYY-MM-DD&mes=YYYY-MM */
export async function obtenerResumen(filtros = {}) {
  return api.get(`/dashboard/resumen${construirQuery(filtros)}`);
}
