// src/features/admin/orders/hooks/useOrders.js
//
// Estado del listado de pedidos del panel y mutaciones contra el API real
// (/api/pedidos). Las llamadas HTTP viven en services/orderService.js.

import { useEffect, useState } from "react";

import * as orderService from "../services/orderService";

const META_INICIAL = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  estados: {},
};

export default function useOrders({
  autoLoad = true,
  page = 1,
  limit = 10,
  estado,
  cliente,
  orden,
  onPageOutOfRange,
} = {}) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(META_INICIAL);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [reprogrammingId, setReprogrammingId] = useState(null);
  const [paymentSavingId, setPaymentSavingId] = useState(null);
  const [paymentUploadingId, setPaymentUploadingId] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    orderService
      .listar({ page, limit, estado, cliente, orden })
      .then(({ data, meta: nuevaMeta }) => {
        if (!activo) return;
        const metaFinal = nuevaMeta ?? { ...META_INICIAL, page, limit };
        setOrders(data);
        setMeta(metaFinal);
        setError("");
        if (page > metaFinal.totalPages) {
          onPageOutOfRange?.(metaFinal.totalPages);
        }
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
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  async function createOrder(datos) {
    setSubmitting(true);
    try {
      return await orderService.crear(datos);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateOrder(id, datos) {
    setSubmitting(true);
    try {
      const actualizado = await orderService.actualizar(id, datos);
      reload();
      return actualizado;
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(id, estado, observacionesEntrega) {
    setStatusSavingId(id);
    try {
      const actualizado = await orderService.cambiarEstado(
        id,
        estado,
        observacionesEntrega
      );
      reload();
      return actualizado;
    } finally {
      setStatusSavingId(null);
    }
  }

  async function rejectOrder(id, motivo) {
    setRejectSubmitting(true);
    try {
      const actualizado = await orderService.rechazar(id, motivo);
      reload();
      return actualizado;
    } finally {
      setRejectSubmitting(false);
    }
  }

  async function uploadPayment(id, archivo) {
    setPaymentUploadingId(id);
    try {
      const actualizado = await orderService.subirComprobante(id, archivo);
      reload();
      return actualizado;
    } finally {
      setPaymentUploadingId(null);
    }
  }

  async function approvePayment(id, monto) {
    setPaymentSavingId(id);
    try {
      const { pedido, advertencia } = await orderService.aprobarComprobante(
        id,
        monto
      );
      reload();
      return { pedido, advertencia };
    } finally {
      setPaymentSavingId(null);
    }
  }

  async function devolverComprobante(id, motivo) {
    setPaymentSavingId(id);
    try {
      const pedido = await orderService.devolverComprobante(id, motivo);
      reload();
      return pedido;
    } finally {
      setPaymentSavingId(null);
    }
  }

  async function reprogramOrder(id, fechaEntrega) {
    setReprogrammingId(id);
    try {
      const actualizado = await orderService.reprogramar(id, fechaEntrega);
      reload();
      return actualizado;
    } finally {
      setReprogrammingId(null);
    }
  }

  return {
    orders,
    meta,
    loading,
    error,
    reload,

    submitting,
    statusSavingId,
    rejectSubmitting,
    reprogrammingId,
    paymentSavingId,
    paymentUploadingId,

    createOrder,
    updateOrder,
    changeStatus,
    rejectOrder,
    uploadPayment,
    approvePayment,
    devolverComprobante,
    reprogramOrder,
  };
}
