// src/models/permiso.model.js
// Consulta de permisos por rol (tablas permiso, modulo, accion y rolPermiso).
import { query } from '../config/db.js';

// Caché en memoria con TTL corto para no consultar los permisos en cada
// petición. El módulo de roles/permisos invalida esta caché al modificarlos.
const TTL_MS = 60_000;
const cache = new Map(); // id_rol -> { datos, creado }

/** Devuelve [{ modulo, accion }] con los permisos concedidos a un rol. */
export async function accionesPorRol(idRol) {
  const k = Number(idRol);
  const entrada = cache.get(k);
  if (entrada && Date.now() - entrada.creado < TTL_MS) return entrada.datos;

  const datos = await query(
    `SELECT m.nombre AS modulo, a.nombre AS accion
       FROM rolPermiso rp
       JOIN permiso p ON p.id = rp.id_permiso
       JOIN modulo  m ON m.id = p.id_modulo
       JOIN accion  a ON a.id = p.id_accion
      WHERE rp.id_rol = ?`,
    [k]
  );

  cache.set(k, { datos, creado: Date.now() });
  return datos;
}

/** Indica si un rol tiene concedido un permiso (módulo + acción). */
export async function tienePermiso(idRol, modulo, accion) {
  const permisos = await accionesPorRol(idRol);
  return permisos.some((p) => p.modulo === modulo && p.accion === accion);
}

/** Invalida la caché de un rol, o toda la caché si no se indica un rol. */
export function invalidarCachePermisos(idRol) {
  if (idRol === undefined) cache.clear();
  else cache.delete(Number(idRol));
}

// ---------------------------------------------------------------------------
// Gestión de permisos (módulo de configuración)
// ---------------------------------------------------------------------------

const SELECT_PERMISO = `SELECT p.id, p.nombre, p.id_modulo, p.id_accion,
         m.nombre AS modulo, a.nombre AS accion
    FROM permiso p
    JOIN modulo m ON m.id = p.id_modulo
    JOIN accion a ON a.id = p.id_accion`;

/** Lista permisos con filtros opcionales por nombre de módulo o de acción. */
export async function listar({ modulo, accion } = {}) {
  const where = [];
  const params = [];

  if (modulo) {
    where.push('LOWER(m.nombre) LIKE LOWER(?)');
    params.push(`%${modulo}%`);
  }
  if (accion) {
    where.push('LOWER(a.nombre) LIKE LOWER(?)');
    params.push(`%${accion}%`);
  }

  const sql = `${SELECT_PERMISO}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY p.id`;
  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_PERMISO} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function buscarPorModuloAccion(idModulo, idAccion) {
  const rows = await query(`${SELECT_PERMISO} WHERE p.id_modulo = ? AND p.id_accion = ? LIMIT 1`, [
    idModulo,
    idAccion,
  ]);
  return rows[0] ?? null;
}

/** Devuelve los permisos asignados a un rol. */
export async function listarPorRol(idRol) {
  return query(
    `SELECT p.id, p.nombre, p.id_modulo, p.id_accion, m.nombre AS modulo, a.nombre AS accion
       FROM rolPermiso rp
       JOIN permiso p ON p.id = rp.id_permiso
       JOIN modulo m ON m.id = p.id_modulo
       JOIN accion a ON a.id = p.id_accion
      WHERE rp.id_rol = ?
      ORDER BY p.id`,
    [idRol]
  );
}

/** Devuelve las filas de permiso cuyos ids existan (para validar asignaciones). */
export async function buscarPorIds(ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return query(`SELECT id FROM permiso WHERE id IN (${placeholders})`, ids);
}

export async function existeNombre(nombre, excluirId = null) {
  const rows = excluirId
    ? await query('SELECT id FROM permiso WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1', [
        nombre,
        excluirId,
      ])
    : await query('SELECT id FROM permiso WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [nombre]);
  return rows.length > 0;
}

export async function crear({ nombre, id_modulo, id_accion }) {
  const resultado = await query(
    'INSERT INTO permiso (nombre, id_modulo, id_accion) VALUES (?, ?, ?)',
    [nombre, id_modulo, id_accion]
  );
  return resultado.insertId;
}

/** Actualiza solo las columnas presentes en `campos`. */
export async function actualizar(id, campos) {
  const columnas = ['nombre', 'id_modulo', 'id_accion'];
  const asignaciones = [];
  const valores = [];

  for (const columna of columnas) {
    if (campos[columna] !== undefined) {
      asignaciones.push(`${columna} = ?`);
      valores.push(campos[columna]);
    }
  }

  if (asignaciones.length === 0) return buscarPorId(id);

  valores.push(id);
  await query(`UPDATE permiso SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM permiso WHERE id = ?', [id]);
}
