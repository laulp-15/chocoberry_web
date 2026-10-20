// src/features/admin/sales/hooks/useSales.js
//
// Estado del listado de ventas del panel y recarga contra el API real
// (/api/ventas). Las llamadas HTTP viven en services/saleService.js.
import { useEffect, useState } from "react";

import * as saleService from "../services/saleService";

export default function useSales({ autoLoad = true } = {}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    saleService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setSales(lista);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudieron cargar las ventas.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [autoLoad, reloadToken]);

  function reload() {
    setError("");
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  }

  return { sales, loading, error, reload };
}
