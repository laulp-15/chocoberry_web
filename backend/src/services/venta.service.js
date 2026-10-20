// src/services/venta.service.js
// Ventas = pedidos confirmados. No existe una tabla `venta`: esta capa expone
// una vista de solo lectura sobre pedido/productoPedido.
//
// Regla de negocio: un pedido es venta cuando está En preparación, Despachado,
// Entregado o Cancelado. Pendiente y Rechazado no son ventas (el pago todavía
// no está aprobado).
import { NotFoundError, UnprocessableEntityError } from '../errors/index.js';
import * as pedidoModel from '../models/pedido.model.js';
import * as productoPedidoModel from '../models/productoPedido.model.js';
import { serializarPedido } from '../utils/serializers.js';
import * as pedidoService from './pedido.service.js';

export const ESTADOS_VENTA = Object.freeze([
  'En preparación',
  'Despachado',
  'Entregado',
  'Cancelado',
]);

const ALIAS_ESTADOS_VENTA = {
  'en preparacion': 'En preparación',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function normalizarEstadoVenta(valor) {
  const clave = String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  return ALIAS_ESTADOS_VENTA[clave] ?? null;
}

function agruparLineas(filas) {
  const mapa = new Map();
  for (const fila of filas) {
    if (!mapa.has(fila.id_pedido)) mapa.set(fila.id_pedido, []);
    mapa.get(fila.id_pedido).push(fila);
  }
  return mapa;
}

/**
 * Lista ventas con filtros opcionales. El conjunto siempre queda limitado a
 * los estados de venta, incluso si se filtra por un estado concreto.
 */
export async function listar(filtros = {}) {
  let estado;

  if (filtros.estado) {
    estado = normalizarEstadoVenta(filtros.estado);
    if (!estado) {
      throw new UnprocessableEntityError(
        `El estado "${filtros.estado}" no hace parte de Ventas. ` +
          'Las ventas son pedidos en preparación, despachados, entregados o cancelados.'
      );
    }
  }

  const filas = await pedidoModel.listar({
    estado,
    estados: ESTADOS_VENTA,
    idMunicipio: filtros.idMunicipio,
    idUsuario: filtros.idUsuario,
    cliente: filtros.cliente,
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
  });

  if (filas.length === 0) return [];

  const lineas = await productoPedidoModel.listarPorPedidos(filas.map((fila) => fila.id));
  const mapa = agruparLineas(lineas);
  return filas.map((fila) => serializarPedido(fila, mapa.get(fila.id) ?? []));
}

/** Detalle de una venta. Devuelve 404 si el pedido existe pero no es venta. */
export async function obtener(id, usuario) {
  const pedido = await pedidoService.obtener(id, usuario);

  if (!ESTADOS_VENTA.includes(pedido.estado.nombre)) {
    throw new NotFoundError('Venta no encontrada.');
  }

  return pedido;
}
