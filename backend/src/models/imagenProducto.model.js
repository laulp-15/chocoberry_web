// src/models/imagenProducto.model.js
// Acceso a la tabla `imagenProducto` (hasta 4 imágenes por producto).
// `orden = 1` es la portada. Los nombres de columnas siguen EXACTAMENTE la
// capitalización del script SQL.
import { query } from '../config/db.js';

const SELECT_BASE = `SELECT id, id_producto, url, orden
                       FROM imagenProducto`;

export async function listarPorProducto(idProducto) {
  return query(`${SELECT_BASE} WHERE id_producto = ? ORDER BY orden ASC`, [idProducto]);
}

/** Carga las imágenes de varios productos en una sola consulta (listados). */
export async function listarPorProductos(ids = []) {
  if (!ids || ids.length === 0) return [];

  const marcadores = ids.map(() => '?').join(', ');
  return query(
    `${SELECT_BASE} WHERE id_producto IN (${marcadores}) ORDER BY id_producto ASC, orden ASC`,
    ids
  );
}

/**
 * Reemplaza la lista completa de imágenes de un producto dentro de una
 * transacción. El orden se asigna según la posición (1..4).
 */
export async function reemplazar(conexion, idProducto, imagenes = []) {
  await conexion.execute('DELETE FROM imagenProducto WHERE id_producto = ?', [idProducto]);

  for (const [indice, imagen] of imagenes.entries()) {
    await conexion.execute(
      'INSERT INTO imagenProducto (id_producto, url, orden) VALUES (?, ?, ?)',
      [idProducto, imagen.url, indice + 1]
    );
  }
}

export async function eliminarPorProducto(conexion, idProducto) {
  await conexion.execute('DELETE FROM imagenProducto WHERE id_producto = ?', [idProducto]);
}
