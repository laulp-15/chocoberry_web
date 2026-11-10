// src/models/colorGlaseado.model.js
// Acceso a la tabla `colorGlaseado` (paleta disponible para las fresas).
import { query } from '../config/db.js';

// Columnas que se pueden actualizar (lista blanca para evitar inyección).
const CAMPOS_ACTUALIZABLES = ['nombre', 'codigo_hex', 'estado'];

const SELECT_BASE = 'SELECT id, nombre, codigo_hex, estado FROM colorGlaseado';

/** Lista colores con filtros opcionales: nombre (parcial) y estado. */
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

/** ¿Existe un color con ese nombre? Ignora `excluirId` (al editar). */
export async function existeNombre(nombre, excluirId = null) {
  const sql = excluirId
    ? 'SELECT id FROM colorGlaseado WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1'
    : 'SELECT id FROM colorGlaseado WHERE LOWER(nombre) = LOWER(?) LIMIT 1';
  const params = excluirId ? [nombre, excluirId] : [nombre];
  return (await query(sql, params)).length > 0;
}

/** Inserta un color y devuelve su id. */
export async function crear({ nombre, codigo_hex, estado }) {
  const resultado = await query(
    'INSERT INTO colorGlaseado (nombre, codigo_hex, estado) VALUES (?, ?, ?)',
    [nombre, codigo_hex, estado ? 1 : 0]
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
  await query(`UPDATE colorGlaseado SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/** Cambia el estado (activo/inactivo) de un color. */
export async function cambiarEstado(id, estado) {
  await query('UPDATE colorGlaseado SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}

/** Cuenta las líneas de pedido que usan el color (para bloquear su eliminación). */
export async function contarEnPedidos(id) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM productoPedido WHERE id_color_glaseado = ?',
    [id]
  );
  return rows[0]?.total ?? 0;
}

export async function eliminar(id) {
  await query('DELETE FROM colorGlaseado WHERE id = ?', [id]);
}
