// src/models/productoPedido.model.js
// Acceso a las líneas de pedido (producto + presentación + glaseado).
// `insertarLineas` recibe la conexión de una transacción abierta por
// pedido.model.js: la cabecera y sus líneas se guardan de forma atómica.
import { query } from '../config/db.js';

const SELECT_BASE = `SELECT pp.id, pp.id_pedido, pp.id_producto, pp.id_presentacion,
                            pp.cantidad_productos, pp.precio_unitario, pp.subtotal,
                            pp.mensaje_personalizado, pp.id_color_glaseado,
                            pp.personalizacion_adicional,
                            pr.nombre AS producto, pr.imagen AS producto_imagen,
                            pres.cantidad_fresas, pres.precio AS presentacion_precio,
                            cg.nombre AS color_nombre, cg.codigo_hex AS color_hex
                       FROM productoPedido pp
                       JOIN producto pr ON pr.id = pp.id_producto
                       JOIN presentacion pres ON pres.id = pp.id_presentacion
                       LEFT JOIN colorGlaseado cg ON cg.id = pp.id_color_glaseado`;

const ORDEN = 'ORDER BY pp.id ASC';

export async function listarPorPedido(idPedido) {
  return query(`${SELECT_BASE} WHERE pp.id_pedido = ? ${ORDEN}`, [idPedido]);
}

/** Carga las líneas de varios pedidos en una sola consulta (para los listados). */
export async function listarPorPedidos(ids) {
  if (!ids || ids.length === 0) return [];
  const marcadores = ids.map(() => '?').join(', ');
  return query(`${SELECT_BASE} WHERE pp.id_pedido IN (${marcadores}) ${ORDEN}`, ids);
}

/** Inserta todas las líneas de un pedido dentro de una transacción. */
export async function insertarLineas(conexion, idPedido, lineas) {
  for (const linea of lineas) {
    await conexion.execute(
      `INSERT INTO productoPedido
         (id_pedido, id_producto, id_presentacion, cantidad_productos,
          precio_unitario, subtotal, mensaje_personalizado, id_color_glaseado,
          personalizacion_adicional)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPedido,
        linea.id_producto,
        linea.id_presentacion,
        linea.cantidad_productos,
        linea.precio_unitario,
        linea.subtotal,
        linea.mensaje_personalizado ?? null,
        linea.id_color_glaseado,
        linea.personalizacion_adicional ?? null,
      ]
    );
  }
}
