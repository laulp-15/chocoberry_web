// src/features/admin/sales/hooks/useSale.js
//
// Detalle de una venta por id contra /api/ventas/:id. Distingue el 404 para
// mostrar "No encontramos esta venta" sin tratarlo como un error inesperado.
import { useEffect, useState } from "react";

import * as saleService from "../services/saleService";

export default function useSale(id) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(!id);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return undefined;

    let activo = true;

    saleService
      .obtener(id)
      .then((venta) => {
        if (!activo) return;
        setSale(venta);
        setError("");
        setNotFound(false);
      })
      .catch((err) => {
        if (!activo) return;
        setSale(null);
        setNotFound(err?.status === 404);
        setError(err?.message || "No se pudo cargar la venta.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [id, reloadToken]);

  function reload() {
    setError("");
    setNotFound(false);
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  }

  return { sale, loading, error, notFound, reload };
}
