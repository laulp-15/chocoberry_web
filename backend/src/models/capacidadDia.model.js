// src/models/capacidadDia.model.js
// Excepciones de capacidad por fecha y cálculo de las fresas ya agendadas.
// Las fresas de un pedido son la suma de `cantidad_productos * cantidad_fresas`
// de sus líneas (presentacion.cantidad_fresas).
import { query } from '../config/db.js';

const SELECT_BASE = 'SELECT id, fecha, max_fresas FROM capacidadDia';

async function ejecutar(sql, params = [], conexion = null) {
  if (conexion) {
    const [filas] = await conexion.execute(sql, params);
    return filas;
  }
  return query(sql, params);
}

function marcadores(valores) {
  return valores.map(() => '?').join(', ');
}

function filtroEstados(estados) {
  if (!Array.isArray(estados) || estados.length === 0) {
    throw new Error('La capacidad requiere al menos un estado que ocupe cupo.');
  }
  return `e.nombre IN (${marcadores(estados)})`;
}

function fechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  const anio = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export async function buscarPorFecha(fecha, conexion = null) {
  const filas = await ejecutar(`${SELECT_BASE} WHERE fecha = ? LIMIT 1`, [fecha], conexion);
  return filas[0] ?? null;
}

export async function buscarPorFechaParaActualizar(fecha, conexion) {
  const filas = await ejecutar(
    `${SELECT_BASE} WHERE fecha = ? FOR UPDATE`,
    [fecha],
    conexion
  );
  return filas[0] ?? null;
}

export async function listarPorRango(desde, hastaExclusiva) {
  const filas = await query(
    `${SELECT_BASE} WHERE fecha >= ? AND fecha < ? ORDER BY fecha ASC`,
    [desde, hastaExclusiva]
  );
  return filas.map((fila) => ({ ...fila, fecha: fechaISO(fila.fecha) }));
}

export async function guardar(fecha, maxFresas, conexion = null) {
  await ejecutar(
    `INSERT INTO capacidadDia (fecha, max_fresas)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE max_fresas = VALUES(max_fresas)`,
    [fecha, maxFresas],
    conexion
  );
  return buscarPorFecha(fecha, conexion);
}

export async function eliminarPorFecha(fecha, conexion = null) {
  await ejecutar('DELETE FROM capacidadDia WHERE fecha = ?', [fecha], conexion);
}

/**
 * Fresas agendadas de una fecha, opcionalmente excluyendo un pedido (para no
 * contar dos veces el pedido que se está editando o reprogramando).
 */
export async function sumarFresasDia(
  fecha,
  estados,
  { excluirPedidoId = null, conexion = null } = {}
) {
  const filtroExcluir =
    excluirPedidoId !== null && excluirPedidoId !== undefined ? 'AND p.id <> ?' : '';
  const params = [fecha, ...estados];
  if (filtroExcluir) params.push(excluirPedidoId);

  const filas = await ejecutar(
    `SELECT COALESCE(SUM(pp.cantidad_productos * pres.cantidad_fresas), 0) AS fresas
       FROM pedido p
       JOIN estadosPedido e ON e.id = p.id_estado
       JOIN productoPedido pp ON pp.id_pedido = p.id
       JOIN presentacion pres ON pres.id = pp.id_presentacion
      WHERE DATE(p.fecha_entrega) = ?
        AND ${filtroEstados(estados)}
        ${filtroExcluir}`,
    params,
    conexion
  );
  return Number(filas[0]?.fresas ?? 0);
}

/** Fresas agendadas por día en un rango [desde, hastaExclusiva). */
export async function sumarFresasPorDia({ desde, hastaExclusiva, estados }) {
  const filas = await query(
    `SELECT DATE(p.fecha_entrega) AS fecha,
            COALESCE(SUM(pp.cantidad_productos * pres.cantidad_fresas), 0) AS fresas
       FROM pedido p
       JOIN estadosPedido e ON e.id = p.id_estado
       JOIN productoPedido pp ON pp.id_pedido = p.id
       JOIN presentacion pres ON pres.id = pp.id_presentacion
      WHERE DATE(p.fecha_entrega) >= ?
        AND DATE(p.fecha_entrega) < ?
        AND ${filtroEstados(estados)}
      GROUP BY DATE(p.fecha_entrega)
      ORDER BY fecha ASC`,
    [desde, hastaExclusiva, ...estados]
  );

  return filas.map((fila) => ({
    fecha: fechaISO(fila.fecha),
    fresas: Number(fila.fresas ?? 0),
  }));
}

/** Pedidos activos de una fecha con sus fresas totales. */
export async function listarPedidosDia(fecha, estados) {
  const filas = await query(
    `SELECT p.id,
            COALESCE(SUM(pp.cantidad_productos * pres.cantidad_fresas), 0) AS fresas
       FROM pedido p
       JOIN estadosPedido e ON e.id = p.id_estado
       JOIN productoPedido pp ON pp.id_pedido = p.id
       JOIN presentacion pres ON pres.id = pp.id_presentacion
      WHERE DATE(p.fecha_entrega) = ?
        AND ${filtroEstados(estados)}
      GROUP BY p.id
      ORDER BY p.id ASC`,
    [fecha, ...estados]
  );

  return filas.map((fila) => ({
    id: fila.id,
    fresas: Number(fila.fresas ?? 0),
  }));
}

/** Fresas totales de un pedido concreto. */
export async function sumarFresasPedido(idPedido) {
  const filas = await query(
    `SELECT COALESCE(SUM(pp.cantidad_productos * pres.cantidad_fresas), 0) AS fresas
       FROM productoPedido pp
       JOIN presentacion pres ON pres.id = pp.id_presentacion
      WHERE pp.id_pedido = ?`,
    [idPedido]
  );
  return Number(filas[0]?.fresas ?? 0);
}
