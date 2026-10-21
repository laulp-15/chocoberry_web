// src/features/admin/dashboard/hooks/useDashboard.js
//
// Estado del Dashboard y recarga contra el API real (/api/dashboard/resumen).
// Las llamadas HTTP viven en services/dashboardService.js.
import { useEffect, useState } from "react";

import * as dashboardService from "../services/dashboardService";
import { mapDashboardResumen } from "../services/dashboardMappers";

export default function useDashboard({ semana, mes, autoLoad = true } = {}) {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    dashboardService
      .obtenerResumen({ semana, mes })
      .then((data) => {
        if (!activo) return;
        setResumen(mapDashboardResumen(data));
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudo cargar el dashboard.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [semana, mes, autoLoad, reloadToken]);

  function reload() {
    setError("");
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  }

  return { resumen, loading, error, reload };
}
