// src/models/presentacion.model.js
// Acceso a la tabla `presentacion` (cantidad de fresas y precio).
import { query } from '../config/db.js';

// Columnas que se pueden actualizar (lista blanca para evitar inyección).
const CAMPOS_ACTUALIZABLES = ['cantidad_fresas', 'precio', 'estado'];

const SELECT_BASE = 'SELECT id, cantidad_fresas, precio, estado FROM presentacion';

/** Lista presentaciones con filtros opcionales: cantidad de fresas y estado. */
export async function listar({ cantidadFresas, estado } = {}) {
  const where = [];
  const params = [];

  if (cantidadFresas) {
    where.push('cantidad_fresas = ?');
    params.push(cantidadFresas);
  }

  if (estado !== undefined) {
    where.push('estado = ?');
    params.push(estado ? 1 : 0);
  }

  const sql = `${SELECT_BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY cantidad_fresas ASC`;
  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** Busca una presentación por su cantidad de fresas (para evitar duplicados). */
export async function buscarPorCantidad(cantidadFresas) {
  const rows = await query(`${SELECT_BASE} WHERE cantidad_fresas = ? LIMIT 1`, [cantidadFresas]);
  return rows[0] ?? null;
}

/** Inserta una presentación y devuelve su id. */
export async function crear({ cantidad_fresas, precio, estado }) {
  const resultado = await query(
    'INSERT INTO presentacion (cantidad_fresas, precio, estado) VALUES (?, ?, ?)',
    [cantidad_fresas, precio, estado ? 1 : 0]
  );
  return resultado.insertId;
}

/** Actualiza solo las columnas presentes en `campos`. */
export async function actualizar(id, campos) {
  const asignaciones = [];
  const valores = [];

  for (const columna of CAMPOS_ACTUALIZABLES) {
    if (campos[columna] !== undefined) {
      asignaciones.push(`${columna} = ?`);
      valores.push(campos[columna]);
    }
  }

  if (asignaciones.length === 0) return buscarPorId(id);

  valores.push(id);
  await query(`UPDATE presentacion SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/** Cambia el estado (activa/inactiva) de una presentación. */
export async function cambiarEstado(id, estado) {
  await query('UPDATE presentacion SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM presentacion WHERE id = ?', [id]);
}

/** Cuenta las líneas de pedido de la presentación (para bloquear su eliminación). */
export async function contarEnPedidos(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM productoPedido WHERE id_presentacion = ?', [id]);
  return rows[0]?.total ?? 0;
}
