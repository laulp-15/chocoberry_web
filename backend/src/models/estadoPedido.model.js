// src/models/estadoPedido.model.js
// Acceso de solo lectura a la tabla de estados del pedido. Los estados son
// datos maestros: se crean con el script SQL, no desde la API.
import { query } from '../config/db.js';

const SELECT_BASE = 'SELECT id, nombre FROM estadosPedido';

export async function listar() {
  return query(`${SELECT_BASE} ORDER BY id ASC`);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** Busca un estado por nombre sin distinguir mayúsculas/minúsculas. */
export async function buscarPorNombre(nombre) {
  const rows = await query(`${SELECT_BASE} WHERE LOWER(nombre) = LOWER(?) LIMIT 1`, [nombre]);
  return rows[0] ?? null;
}
