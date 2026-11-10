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

/** GET /dashboard/resumen?mes=YYYY-MM */
export async function obtenerResumen(filtros = {}) {
  return api.get(`/dashboard/resumen${construirQuery(filtros)}`);
}

/** GET /dashboard/exportar/pdf|excel?mes=YYYY-MM */
export async function descargarReporte(formato, filtros = {}) {
  const tipo = formato === "excel" ? "excel" : "pdf";
  const extension = tipo === "excel" ? "xlsx" : "pdf";
  return api.download(`/dashboard/exportar/${tipo}${construirQuery(filtros)}`, {
    fallbackName: `reporte-ventas.${extension}`,
  });
}
