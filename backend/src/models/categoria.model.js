// src/models/categoria.model.js
// Acceso a la tabla `categoria`. Los nombres de columnas siguen EXACTAMENTE la
// capitalización del script SQL (importante en Linux).
import { query } from '../config/db.js';

// Columnas que se pueden actualizar (lista blanca para evitar inyección).
const CAMPOS_ACTUALIZABLES = ['nombre', 'estado'];

const SELECT_BASE = 'SELECT id, nombre, estado FROM categoria';

/** Lista categorías con filtros opcionales: nombre (parcial) y estado. */
export async function listar({ nombre, estado } = {}) {
  const where = [];
  const params = [];

  if (nombre) {
    where.push('nombre LIKE ?');
    params.push(`%${nombre}%`);
  }

  if (estado !== undefined) {
    where.push('estado = ?');
    params.push(estado ? 1 : 0);
  }

  const sql = `${SELECT_BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY nombre ASC`;
  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** Busca por nombre sin distinguir mayúsculas/minúsculas. */
export async function buscarPorNombre(nombre) {
  const rows = await query(`${SELECT_BASE} WHERE LOWER(nombre) = LOWER(?) LIMIT 1`, [nombre]);
  return rows[0] ?? null;
}

/** ¿Existe una categoría con ese nombre? Ignora `excluirId` (al editar). */
export async function existeNombre(nombre, excluirId = null) {
  const sql = excluirId
    ? 'SELECT id FROM categoria WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1'
    : 'SELECT id FROM categoria WHERE LOWER(nombre) = LOWER(?) LIMIT 1';
  const params = excluirId ? [nombre, excluirId] : [nombre];
  return (await query(sql, params)).length > 0;
}

/** Inserta una categoría y devuelve su id. */
export async function crear({ nombre, estado }) {
  const resultado = await query('INSERT INTO categoria (nombre, estado) VALUES (?, ?)', [
    nombre,
    estado ? 1 : 0,
  ]);
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
  await query(`UPDATE categoria SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/** Cambia el estado (activa/inactiva) de una categoría. */
export async function cambiarEstado(id, estado) {
  await query('UPDATE categoria SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM categoria WHERE id = ?', [id]);
}

/** Cuenta los productos de la categoría (para bloquear su eliminación). */
export async function contarProductos(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM producto WHERE id_categoria = ?', [id]);
  return rows[0]?.total ?? 0;
}
