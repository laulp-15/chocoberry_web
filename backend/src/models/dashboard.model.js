// src/models/dashboard.model.js
// Consultas agregadas para el Dashboard. No hay una tabla nueva: todo se
// calcula sobre pedido, productoPedido, resena, municipio y estadosPedido.
import { query } from '../config/db.js';

function marcadores(valores) {
  return valores.map(() => '?').join(', ');
}

function filtroEstados(estados) {
  if (!Array.isArray(estados) || estados.length === 0) {
    throw new Error('El dashboard requiere al menos un estado de venta.');
  }
  return `e.nombre IN (${marcadores(estados)})`;
}

/**
 * Totales de ingresos por día o por mes. Se agrupa primero por pedido para
 * sumar el domicilio una sola vez, aunque el pedido tenga varias líneas.
 */
async function ingresosAgrupados({ desde, hastaExclusiva, estados, formato }) {
  const sql = `
    SELECT DATE_FORMAT(x.fecha, '${formato}') AS periodo,
           SUM(x.total) AS total,
           COUNT(*) AS pedidos
      FROM (
        SELECT p.id, p.fecha,
               SUM(pp.subtotal) + p.precio_domicilio AS total
          FROM pedido p
          JOIN estadosPedido e ON e.id = p.id_estado
          JOIN productoPedido pp ON pp.id_pedido = p.id
         WHERE ${filtroEstados(estados)}
           AND p.fecha >= ?
           AND p.fecha < ?
         GROUP BY p.id, p.fecha, p.precio_domicilio
      ) x
     GROUP BY DATE_FORMAT(x.fecha, '${formato}')
     ORDER BY periodo ASC`;

  return query(sql, [...estados, desde, hastaExclusiva]);
}

export async function ingresosPorDia({ desde, hastaExclusiva, estados }) {
  return ingresosAgrupados({ desde, hastaExclusiva, estados, formato: '%Y-%m-%d' });
}

export async function ingresosPorMes({ desde, hastaExclusiva, estados }) {
  return ingresosAgrupados({ desde, hastaExclusiva, estados, formato: '%Y-%m' });
}

/** Total y cantidad de pedidos vendidos en un rango. */
export async function ingresosTotales({ desde, hastaExclusiva, estados }) {
  const sql = `
    SELECT COALESCE(SUM(x.total), 0) AS total,
           COUNT(*) AS pedidos
      FROM (
        SELECT p.id, SUM(pp.subtotal) + p.precio_domicilio AS total
          FROM pedido p
          JOIN estadosPedido e ON e.id = p.id_estado
          JOIN productoPedido pp ON pp.id_pedido = p.id
         WHERE ${filtroEstados(estados)}
           AND p.fecha >= ?
           AND p.fecha < ?
         GROUP BY p.id, p.precio_domicilio
      ) x`;

  const filas = await query(sql, [...estados, desde, hastaExclusiva]);
  return filas[0] ?? { total: 0, pedidos: 0 };
}

/** Ranking histórico de productos por unidades vendidas. */
export async function topProductos({ estados, limite = 5 }) {
  const limiteSeguro = Math.min(Math.max(Number(limite) || 5, 1), 50);
  const sql = `
    SELECT pr.id, pr.nombre,
           SUM(pp.cantidad_productos) AS unidades,
           SUM(pp.subtotal) AS ingresos
      FROM productoPedido pp
      JOIN pedido p ON p.id = pp.id_pedido
      JOIN estadosPedido e ON e.id = p.id_estado
      JOIN producto pr ON pr.id = pp.id_producto
     WHERE ${filtroEstados(estados)}
     GROUP BY pr.id, pr.nombre
     ORDER BY unidades DESC, ingresos DESC, pr.nombre ASC
     LIMIT ${limiteSeguro}`;

  return query(sql, estados);
}

/** Pedidos actuales agrupados por estado, incluyendo estados sin pedidos. */
export async function contarPedidosPorEstado() {
  const sql = `
    SELECT e.id, e.nombre AS estado, COUNT(p.id) AS pedidos
      FROM estadosPedido e
      LEFT JOIN pedido p ON p.id_estado = e.id
     GROUP BY e.id, e.nombre
     ORDER BY e.id ASC`;

  return query(sql);
}

/** Pedidos agrupados por municipio. */
export async function contarPedidosPorMunicipio() {
  const sql = `
    SELECT m.id, m.nombre AS municipio, COUNT(p.id) AS pedidos
      FROM municipio m
      JOIN pedido p ON p.id_municipio = m.id
     GROUP BY m.id, m.nombre
     ORDER BY pedidos DESC, m.nombre ASC`;

  return query(sql);
}

/** Distribución y promedio de todas las reseñas, activas e inactivas. */
export async function resumenResenas() {
  const sql = `
    SELECT COUNT(*) AS total,
           COALESCE(AVG(calificacion), 0) AS promedio,
           COALESCE(SUM(calificacion = 1), 0) AS estrellas_1,
           COALESCE(SUM(calificacion = 2), 0) AS estrellas_2,
           COALESCE(SUM(calificacion = 3), 0) AS estrellas_3,
           COALESCE(SUM(calificacion = 4), 0) AS estrellas_4,
           COALESCE(SUM(calificacion = 5), 0) AS estrellas_5
      FROM resena`;

  const filas = await query(sql);
  return filas[0];
}

/** Primer y último pedido registrados, para deshabilitar períodos sin datos. */
export async function obtenerRangoPedidos() {
  const sql = `
    SELECT DATE_FORMAT(MIN(fecha), '%Y-%m-%d') AS primer_pedido,
           DATE_FORMAT(MAX(fecha), '%Y-%m-%d') AS ultimo_pedido
      FROM pedido`;

  const filas = await query(sql);
  return filas[0] ?? { primer_pedido: null, ultimo_pedido: null };
}
