// src/features/admin/sales/hooks/useSales.js
//
// Estado del listado de ventas del panel y recarga contra el API real
// (/api/ventas). Las llamadas HTTP viven en services/saleService.js.
import { useEffect, useState } from "react";

import * as saleService from "../services/saleService";

const META_INICIAL = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export default function useSales({
  autoLoad = true,
  page = 1,
  limit = 10,
  estado,
  cliente,
  orden,
  onPageOutOfRange,
} = {}) {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(META_INICIAL);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    saleService
      .listar({ page, limit, estado, cliente, orden })
      .then(({ data, meta: nuevaMeta }) => {
        if (!activo) return;
        const metaFinal = nuevaMeta ?? { ...META_INICIAL, page, limit };
        setSales(data);
        setMeta(metaFinal);
        setError("");
        if (page > metaFinal.totalPages) {
          onPageOutOfRange?.(metaFinal.totalPages);
        }
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
  }, [
    autoLoad,
    reloadToken,
    page,
    limit,
    estado,
    cliente,
    orden,
    onPageOutOfRange,
  ]);

  function reload() {
    setError("");
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  }

  return { sales, meta, loading, error, reload };
}
