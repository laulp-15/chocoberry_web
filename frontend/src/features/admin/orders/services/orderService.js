// src/features/admin/orders/services/orderService.js
//
// Llamadas reales al backend de pedidos (/api/pedidos) para el panel
// administrador. Solo esta capa conoce esas rutas; el hook y las páginas
// consumen las funciones ya traducidas al shape del panel.

import { api } from "../../../../shared/api/client";
import {
  mapPedidoAdmin,
  mapPedidosAdmin,
  toActualizarPedidoPayload,
  toCrearPedidoFormData,
} from "./orderMappers";

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

/**
 * GET /pedidos -> pedidos del alcance del usuario. Con `page`/`limit` el
 * backend responde `{ data, meta }`; sin ellos conserva el array completo.
 */
export async function listar(filtros = {}) {
  const respuesta = await api.get(`/pedidos${construirQuery(filtros)}`);

  if (Array.isArray(respuesta)) {
    return { data: mapPedidosAdmin(respuesta), meta: null };
  }

  return {
    data: mapPedidosAdmin(respuesta?.data ?? []),
    meta: respuesta?.meta ?? null,
  };
}

/** GET /pedidos/:id */
export async function obtener(id) {
  const pedido = await api.get(`/pedidos/${id}`);
  return mapPedidoAdmin(pedido);
}

/** POST /pedidos (multipart con comprobante y líneas JSON). */
export async function crear(datos) {
  const pedido = await api.post("/pedidos", toCrearPedidoFormData(datos));
  return mapPedidoAdmin(pedido);
}

/** PUT /pedidos/:id (cabecera y, opcionalmente, lista completa de líneas). */
export async function actualizar(id, datos) {
  const pedido = await api.put(
    `/pedidos/${id}`,
    toActualizarPedidoPayload(datos)
  );
  return mapPedidoAdmin(pedido);
}

/**
 * PATCH /pedidos/:id/estado
 * Al cancelar, `observacionesEntrega` lleva el motivo obligatorio.
 */
export async function cambiarEstado(id, estado, observacionesEntrega) {
  const payload = { estado };
  if (observacionesEntrega) payload.observacionesEntrega = observacionesEntrega;
  const pedido = await api.patch(`/pedidos/${id}/estado`, payload);
  return mapPedidoAdmin(pedido);
}

/** PATCH /pedidos/:id/reprogramar (solo pedidos cancelados recientes). */
export async function reprogramar(id, fechaEntrega) {
  const pedido = await api.patch(`/pedidos/${id}/reprogramar`, { fechaEntrega });
  return mapPedidoAdmin(pedido);
}

/** PATCH /pedidos/:id/rechazar */
export async function rechazar(id, motivo) {
  const pedido = await api.patch(`/pedidos/${id}/rechazar`, { motivo });
  return mapPedidoAdmin(pedido);
}

/** POST /pedidos/:id/comprobantes (multipart con el comprobante). */
export async function subirComprobante(id, archivo) {
  const formData = new FormData();
  formData.append("comprobante", archivo);

  const pedido = await api.post(`/pedidos/${id}/comprobantes`, formData);
  return mapPedidoAdmin(pedido);
}

/** PATCH /comprobantes/:id/aprobar. Devuelve el pedido y una advertencia. */
export async function aprobarComprobante(id, monto) {
  const resultado = await api.patch(`/comprobantes/${id}/aprobar`, { monto });
  return {
    pedido: mapPedidoAdmin(resultado.pedido),
    advertencia: resultado.advertencia ?? "",
  };
}

/** PATCH /comprobantes/:id/devolver */
export async function devolverComprobante(id, motivo) {
  const pedido = await api.patch(`/comprobantes/${id}/devolver`, { motivo });
  return mapPedidoAdmin(pedido);
}

/** DELETE /pedidos/:id */
export async function eliminar(id) {
  await api.del(`/pedidos/${id}`);
}
