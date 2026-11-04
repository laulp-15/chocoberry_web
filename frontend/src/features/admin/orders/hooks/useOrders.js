// src/features/admin/orders/hooks/useOrders.js
//
// Estado del listado de pedidos del panel y mutaciones contra el API real
// (/api/pedidos). Las llamadas HTTP viven en services/orderService.js.

import { useEffect, useState } from "react";

import * as orderService from "../services/orderService";

function hoyISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Ordena por fecha de entrega: primero las futuras (de la más cercana a la más
 * lejana) y después las pasadas (de la más reciente a la más antigua). Las
 * entregas de hoy cuentan como futuras; los pedidos sin fecha van al final.
 */
function ordenarPorEntrega(lista) {
  const hoy = hoyISO();

  return [...lista].sort((a, b) => {
    const fechaA = String(a.fechaEntrega ?? "");
    const fechaB = String(b.fechaEntrega ?? "");

    if (!fechaA && !fechaB) return Number(b.id ?? 0) - Number(a.id ?? 0);
    if (!fechaA) return 1;
    if (!fechaB) return -1;

    const pasadaA = fechaA < hoy;
    const pasadaB = fechaB < hoy;
    if (pasadaA !== pasadaB) return pasadaA ? 1 : -1;

    const porFecha = pasadaA
      ? fechaB.localeCompare(fechaA)
      : fechaA.localeCompare(fechaB);
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
  const [reprogrammingId, setReprogrammingId] = useState(null);
  const [paymentSavingId, setPaymentSavingId] = useState(null);
  const [paymentUploadingId, setPaymentUploadingId] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    orderService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setOrders(ordenarPorEntrega(lista));
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
      ordenarPorEntrega(
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
      setOrders((prev) => ordenarPorEntrega([creado, ...prev]));
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

  async function changeStatus(id, estado, observacionesEntrega) {
    setStatusSavingId(id);
    try {
      const actualizado = await orderService.cambiarEstado(
        id,
        estado,
        observacionesEntrega
      );
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

  async function uploadPayment(id, archivo) {
    setPaymentUploadingId(id);
    try {
      const actualizado = await orderService.subirComprobante(id, archivo);
      reemplazar(actualizado);
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
      reemplazar(pedido);
      return { pedido, advertencia };
    } finally {
      setPaymentSavingId(null);
    }
  }

  async function rejectPayment(id, motivo, monto) {
    setPaymentSavingId(id);
    try {
      const pedido = await orderService.rechazarComprobante(id, motivo, monto);
      reemplazar(pedido);
      return pedido;
    } finally {
      setPaymentSavingId(null);
    }
  }

  async function reprogramOrder(id, fechaEntrega) {
    setReprogrammingId(id);
    try {
      const actualizado = await orderService.reprogramar(id, fechaEntrega);
      reemplazar(actualizado);
      return actualizado;
    } finally {
      setReprogrammingId(null);
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
    reprogrammingId,
    paymentSavingId,
    paymentUploadingId,

    createOrder,
    updateOrder,
    changeStatus,
    rejectOrder,
    uploadPayment,
    approvePayment,
    rejectPayment,
    reprogramOrder,
  };
}
