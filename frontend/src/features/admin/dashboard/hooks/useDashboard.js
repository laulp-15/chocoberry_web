// src/features/admin/dashboard/hooks/useDashboard.js
//
// Estado del Dashboard y recarga contra el API real (/api/dashboard/resumen).
// Las llamadas HTTP viven en services/dashboardService.js.
import { useEffect, useReducer, useRef } from "react";

import * as dashboardService from "../services/dashboardService";
import { mapDashboardResumen } from "../services/dashboardMappers";

function estadoInicial(autoLoad) {
  return {
    resumen: null,
    loading: autoLoad,
    error: "",
    reloadToken: 0,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "solicitar":
      return {
        ...state,
        resumen: action.limpiar ? null : state.resumen,
        loading: true,
        error: "",
      };
    case "exito":
      return { ...state, resumen: action.resumen, loading: false, error: "" };
    case "error":
      return { ...state, loading: false, error: action.error };
    case "recargar":
      return {
        ...state,
        loading: true,
        error: "",
        reloadToken: state.reloadToken + 1,
      };
    default:
      return state;
  }
}

function mesFallback(anios) {
  if (!anios.length) return null;

  const hoy = new Date();
  const ultimoAnio = anios[anios.length - 1];
  const mes = ultimoAnio === hoy.getFullYear() ? hoy.getMonth() + 1 : 12;
  return `${ultimoAnio}-${String(mes).padStart(2, "0")}`;
}

export default function useDashboard({ mes, autoLoad = true } = {}) {
  const [state, dispatch] = useReducer(reducer, autoLoad, estadoInicial);
  const mesAnterior = useRef(mes);

  useEffect(() => {
    if (!autoLoad && state.reloadToken === 0) return undefined;

    let activo = true;
    const limpiar = mesAnterior.current !== mes;
    mesAnterior.current = mes;
    dispatch({ type: "solicitar", limpiar });

    dashboardService
      .obtenerResumen({ mes })
      .then(async (data) => {
        if (!activo) return;

        const mapeado = mapDashboardResumen(data);
        const anios = mapeado.disponibilidad.aniosDisponibles;
        const anioSolicitado = mapeado.periodo.anio;

        if (anios.length && !anios.includes(anioSolicitado)) {
          const fallback = mesFallback(anios);
          if (fallback && fallback !== mes) {
            const dataFallback = await dashboardService.obtenerResumen({ mes: fallback });
            if (!activo) return;
            dispatch({ type: "exito", resumen: mapDashboardResumen(dataFallback) });
            return;
          }
        }

        dispatch({ type: "exito", resumen: mapeado });
      })
      .catch((err) => {
        if (!activo) return;
        dispatch({
          type: "error",
          error: err?.message || "No se pudo cargar el dashboard.",
        });
      });

    return () => {
      activo = false;
    };
  }, [mes, autoLoad, state.reloadToken]);

  function reload() {
    dispatch({ type: "recargar" });
  }

  return { resumen: state.resumen, loading: state.loading, error: state.error, reload };
}
