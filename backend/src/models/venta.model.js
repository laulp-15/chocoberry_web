// src/models/venta.model.js
// Consultas de soporte para la vista de Ventas. No existe una tabla `venta`:
// el reporte se calcula sobre pedido, productoPedido y estadosPedido.
import { query } from '../config/db.js';
import { fechaHora, formatearFecha, parseFecha, sumarDias } from '../utils/dates.js';

function marcadores(valores) {
  return valores.map(() => '?').join(', ');
}

/**
 * Devuelve una fila por pedido vendido dentro del rango, con su fecha de
 * calendario y el total (líneas + domicilio). El rango se interpreta como
 * fechas de Colombia: 00:00:00 del primer día a 23:59:59 del último.
 */
export async function listarParaReporte({ desde, hasta, estados }) {
  if (!Array.isArray(estados) || estados.length === 0) {
    throw new Error('El reporte de ventas requiere al menos un estado de venta.');
  }

  const hastaExclusiva = formatearFecha(sumarDias(parseFecha(hasta), 1));
  const sql = `
    SELECT p.id,
           DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha,
           e.nombre AS estado,
           COALESCE(SUM(pp.subtotal), 0) + p.precio_domicilio AS total
      FROM pedido p
      JOIN estadosPedido e ON e.id = p.id_estado
      LEFT JOIN productoPedido pp ON pp.id_pedido = p.id
     WHERE e.nombre IN (${marcadores(estados)})
       AND p.fecha >= ?
       AND p.fecha < ?
     GROUP BY p.id, p.fecha, p.precio_domicilio, e.nombre
     ORDER BY p.fecha ASC, p.id ASC`;

  const params = [
    ...estados,
    fechaHora(parseFecha(desde)),
    fechaHora(parseFecha(hastaExclusiva)),
  ];

  return query(sql, params);
}
