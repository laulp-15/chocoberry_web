// src/models/modulo.model.js
// Acceso a la tabla `modulo` (módulos del sistema: Usuarios, Productos, ...).
import { query } from '../config/db.js';

export async function listar({ nombre } = {}) {
  if (nombre) {
    return query('SELECT id, nombre FROM modulo WHERE LOWER(nombre) LIKE LOWER(?) ORDER BY id', [
      `%${nombre}%`,
    ]);
  }
  return query('SELECT id, nombre FROM modulo ORDER BY id');
}

export async function buscarPorId(id) {
  const rows = await query('SELECT id, nombre FROM modulo WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function buscarPorNombre(nombre) {
  const rows = await query('SELECT id, nombre FROM modulo WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [
    nombre,
  ]);
  return rows[0] ?? null;
}

/** ¿Existe ya un módulo con ese nombre? (opcionalmente excluyendo un id) */
export async function existeNombre(nombre, excluirId = null) {
  const rows = excluirId
    ? await query('SELECT id FROM modulo WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1', [
        nombre,
        excluirId,
      ])
    : await query('SELECT id FROM modulo WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [nombre]);
  return rows.length > 0;
}

export async function crear(nombre) {
  const resultado = await query('INSERT INTO modulo (nombre) VALUES (?)', [nombre]);
  return resultado.insertId;
}

export async function actualizar(id, nombre) {
  await query('UPDATE modulo SET nombre = ? WHERE id = ?', [nombre, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM modulo WHERE id = ?', [id]);
}

/** Cuenta los permisos que dependen de un módulo. */
export async function contarPermisos(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM permiso WHERE id_modulo = ?', [id]);
  return rows[0]?.total ?? 0;
}
