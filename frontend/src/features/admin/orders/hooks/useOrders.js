// src/features/admin/orders/hooks/useOrders.js
//
// Estado del listado de pedidos del panel y mutaciones contra el API real
// (/api/pedidos). Las llamadas HTTP viven en services/orderService.js.

import { useEffect, useState } from "react";

import * as orderService from "../services/orderService";

/**
 * Ordena por fecha de creación, de la más reciente a la más antigua. El id
 * desempata los pedidos creados dentro del mismo día.
 */
function ordenarPorCreacion(lista) {
  return [...lista].sort((a, b) => {
    const porFecha = String(b.fecha ?? "").localeCompare(String(a.fecha ?? ""));
    return porFecha !== 0 ? porFecha : Number(b.id ?? 0) - Number(a.id ?? 0);
  });
}

export default function useOrders({ autoLoad = true } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    orderService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setOrders(ordenarPorCreacion(lista));
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudieron cargar los pedidos.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [autoLoad, reloadToken]);

  function reload() {
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  function reemplazar(actualizado) {
    setOrders((prev) =>
      ordenarPorCreacion(
        prev.map((pedido) =>
          String(pedido.id) === String(actualizado.id) ? actualizado : pedido
        )
      )
    );
  }

  async function createOrder(datos) {
    setSubmitting(true);
    try {
      const creado = await orderService.crear(datos);
      setOrders((prev) => ordenarPorCreacion([creado, ...prev]));
      return creado;
    } finally {
      setSubmitting(false);
    }
  }

  async function updateOrder(id, datos) {
    setSubmitting(true);
    try {
      const actualizado = await orderService.actualizar(id, datos);
      reemplazar(actualizado);
      return actualizado;
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(id, estado) {
    setStatusSavingId(id);
    try {
      const actualizado = await orderService.cambiarEstado(id, estado);
      reemplazar(actualizado);
      return actualizado;
    } finally {
      setStatusSavingId(null);
    }
  }

  async function rejectOrder(id, motivo) {
    setRejectSubmitting(true);
    try {
      const actualizado = await orderService.rechazar(id, motivo);
      reemplazar(actualizado);
      return actualizado;
    } finally {
      setRejectSubmitting(false);
    }
  }

  return {
    orders,
    loading,
    error,
    reload,

    submitting,
    statusSavingId,
    rejectSubmitting,

    createOrder,
    updateOrder,
    changeStatus,
    rejectOrder,
  };
}
