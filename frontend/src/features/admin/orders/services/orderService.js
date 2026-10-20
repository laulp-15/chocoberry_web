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

/** GET /pedidos -> todos los pedidos (el admin ve el alcance completo). */
export async function listar(filtros = {}) {
  const pedidos = await api.get(`/pedidos${construirQuery(filtros)}`);
  return mapPedidosAdmin(pedidos);
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

/** PUT /pedidos/:id (solo cabecera). */
export async function actualizar(id, datos) {
  const pedido = await api.put(
    `/pedidos/${id}`,
    toActualizarPedidoPayload(datos)
  );
  return mapPedidoAdmin(pedido);
}

/** PATCH /pedidos/:id/estado */
export async function cambiarEstado(id, estado) {
  const pedido = await api.patch(`/pedidos/${id}/estado`, { estado });
  return mapPedidoAdmin(pedido);
}

/** PATCH /pedidos/:id/rechazar */
export async function rechazar(id, motivo) {
  const pedido = await api.patch(`/pedidos/${id}/rechazar`, { motivo });
  return mapPedidoAdmin(pedido);
}

/** DELETE /pedidos/:id */
export async function eliminar(id) {
  await api.del(`/pedidos/${id}`);
}
