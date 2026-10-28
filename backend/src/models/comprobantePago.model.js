// src/models/comprobantePago.model.js
// Acceso a los comprobantes de pago. Un pedido puede tener varios: los
// aprobados y rechazados se conservan como historial.
import { query } from '../config/db.js';

const SELECT_BASE = `SELECT cp.id, cp.url, cp.monto, cp.fecha, cp.motivo_rechazo,
                            cp.id_pedido, cp.id_estado,
                            ec.nombre AS estado_comprobante
                       FROM comprobantePago cp
                       JOIN estadosComprobante ec ON ec.id = cp.id_estado`;

const SELECT_CON_PEDIDO = `SELECT cp.id, cp.url, cp.monto, cp.fecha, cp.motivo_rechazo,
                                  cp.id_pedido, cp.id_estado,
                                  ec.nombre AS estado_comprobante,
                                  p.id_usuario, p.id_estado AS id_estado_pedido,
                                  ep.nombre AS estado_pedido
                             FROM comprobantePago cp
                             JOIN estadosComprobante ec ON ec.id = cp.id_estado
                             JOIN pedido p ON p.id = cp.id_pedido
                             JOIN estadosPedido ep ON ep.id = p.id_estado`;

const SELECT_PEDIDO_BLOQUEADO = `SELECT p.id, p.id_usuario, p.id_estado,
                                       ep.nombre AS estado_pedido
                                  FROM pedido p
                                  JOIN estadosPedido ep ON ep.id = p.id_estado
                                 WHERE p.id = ?
                                 LIMIT 1
                                   FOR UPDATE`;

/** Ejecuta con la conexión de una transacción o con el pool. */
async function ejecutar(sql, params = [], conexion = null) {
  if (conexion) {
    const [resultado] = await conexion.execute(sql, params);
    return resultado;
  }
  return query(sql, params);
}

export async function listarPorPedido(idPedido) {
  return query(`${SELECT_BASE} WHERE cp.id_pedido = ? ORDER BY cp.id ASC`, [idPedido]);
}

/** Carga los comprobantes de varios pedidos en una sola consulta. */
export async function listarPorPedidos(ids) {
  if (!ids || ids.length === 0) return [];
  const marcadores = ids.map(() => '?').join(', ');
  return query(
    `${SELECT_BASE} WHERE cp.id_pedido IN (${marcadores}) ORDER BY cp.id ASC`,
    ids
  );
}

/**
 * Busca un comprobante junto con su pedido. Con `forUpdate` bloquea las filas
 * durante una transacción para evitar carreras al aprobar o rechazar.
 */
export async function buscarConPedido(id, { conexion = null, forUpdate = false } = {}) {
  const filas = await ejecutar(
    `${SELECT_CON_PEDIDO} WHERE cp.id = ? LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id],
    conexion
  );
  return filas[0] ?? null;
}

/** Bloquea el pedido para validar cupo y saldo antes de insertar. */
export async function buscarPedidoParaComprobante(idPedido, conexion) {
  const filas = await ejecutar(SELECT_PEDIDO_BLOQUEADO, [idPedido], conexion);
  return filas[0] ?? null;
}

export async function crear(conexion, { url, idPedido, idEstado }) {
  const resultado = await ejecutar(
    `INSERT INTO comprobantePago (url, id_pedido, id_estado)
     VALUES (?, ?, ?)`,
    [url, idPedido, idEstado],
    conexion
  );
  return resultado.insertId;
}

/** Aprueba solo si el comprobante sigue Pendiente. Devuelve filas afectadas. */
export async function aprobar(conexion, id, { monto, idEstado, idEstadoPendiente }) {
  const resultado = await ejecutar(
    `UPDATE comprobantePago
        SET id_estado = ?, monto = ?, motivo_rechazo = NULL
      WHERE id = ? AND id_estado = ?`,
    [idEstado, monto, id, idEstadoPendiente],
    conexion
  );
  return resultado.affectedRows;
}

/**
 * Rechaza solo si el comprobante sigue Pendiente. Guarda el valor realmente
 * entregado, que también cuenta para el saldo del pedido.
 */
export async function rechazar(
  conexion,
  id,
  { motivo, monto, idEstado, idEstadoPendiente }
) {
  const resultado = await ejecutar(
    `UPDATE comprobantePago
        SET id_estado = ?, monto = ?, motivo_rechazo = ?
      WHERE id = ? AND id_estado = ?`,
    [idEstado, monto, motivo, id, idEstadoPendiente],
    conexion
  );
  return resultado.affectedRows;
}

/** Elimina solo comprobantes Pendientes. Devuelve filas afectadas. */
export async function eliminar(conexion, id, idEstadoPendiente) {
  const resultado = await ejecutar(
    'DELETE FROM comprobantePago WHERE id = ? AND id_estado = ?',
    [id, idEstadoPendiente],
    conexion
  );
  return resultado.affectedRows;
}

/**
 * Resumen de pago calculado con subconsultas independientes (sin unir
 * productoPedido con comprobantePago):
 * - total = suma de líneas + domicilio.
 * - pagado = suma de montos Aprobados y Rechazados (abonos registrados).
 * - activos = comprobantes Pendientes + Aprobados (para el tope de 3).
 */
export async function resumenPago(idPedido, conexion = null) {
  const filas = await ejecutar(
    `SELECT p.id,
            (SELECT COALESCE(SUM(pp.subtotal), 0)
               FROM productoPedido pp
              WHERE pp.id_pedido = p.id) + p.precio_domicilio AS total,
            (SELECT COALESCE(SUM(cp.monto), 0)
               FROM comprobantePago cp
               JOIN estadosComprobante ec ON ec.id = cp.id_estado
              WHERE cp.id_pedido = p.id
                AND ec.nombre IN ('Aprobado', 'Rechazado')
                AND cp.monto IS NOT NULL) AS pagado,
            (SELECT COUNT(*)
               FROM comprobantePago cp
               JOIN estadosComprobante ec ON ec.id = cp.id_estado
              WHERE cp.id_pedido = p.id
                AND ec.nombre IN ('Pendiente', 'Aprobado')) AS activos
       FROM pedido p
      WHERE p.id = ?
      LIMIT 1`,
    [idPedido],
    conexion
  );
  return filas[0] ?? null;
}
