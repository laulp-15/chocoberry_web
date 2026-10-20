// src/features/orders/services/orderService.js
//
// Llamadas reales al backend de pedidos (/api/pedidos). Solo esta capa conoce
// esas rutas; el checkout y "Mis pedidos" consumen estas funciones.

import { api } from '../../../shared/api/client';
import { mapPedido, mapPedidos } from './orderMappers';

/**
 * POST /pedidos (multipart/form-data con el comprobante y `lineas` en JSON).
 * @param {FormData} datos
 */
export async function crear(datos) {
  const pedido = await api.post('/pedidos', datos);
  return mapPedido(pedido);
}

/** GET /pedidos/mios: pedidos del usuario autenticado. */
export async function listarMios() {
  const pedidos = await api.get('/pedidos/mios');
  return mapPedidos(pedidos);
}

/** GET /pedidos/mios/:id */
export async function obtenerMio(id) {
  const pedido = await api.get(`/pedidos/mios/${id}`);
  return mapPedido(pedido);
}
