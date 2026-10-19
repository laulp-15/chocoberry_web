// src/models/rol.model.js
// Acceso a la tabla `rol`. Los roles base son Administrador (1),
// Repartidor (2) y Cliente (3).
import { query } from '../config/db.js';
import { slugify } from '../utils/text.js';

export async function listar() {
  return query('SELECT id, nombre_rol FROM rol ORDER BY id');
}

export async function buscarPorId(id) {
  const rows = await query('SELECT id, nombre_rol FROM rol WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

/**
 * Busca un rol por id, nombre ("Cliente") o slug ("cliente").
 * Es tolerante a mayúsculas y tildes para facilitar el uso desde el front.
 */
export async function buscarPorNombreOSlug(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  if (typeof valor === 'number' || /^\d+$/.test(String(valor))) {
    return buscarPorId(Number(valor));
  }

  const roles = await listar();
  const objetivo = String(valor).trim().toLowerCase();
  return (
    roles.find(
      (rol) =>
        rol.nombre_rol.toLowerCase() === objetivo || slugify(rol.nombre_rol) === slugify(objetivo)
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Gestión de roles (módulo de configuración)
// ---------------------------------------------------------------------------

const SELECT_CON_CONTEO = `SELECT r.id, r.nombre_rol,
         COUNT(DISTINCT u.id) AS total_usuarios,
         COUNT(DISTINCT rp.id_permiso) AS total_permisos
    FROM rol r
    LEFT JOIN usuario u ON u.id_rol = r.id
    LEFT JOIN rolPermiso rp ON rp.id_rol = r.id`;

/** Lista roles con el conteo de permisos y de usuarios asignados. */
export async function listarConConteo({ nombre } = {}) {
  if (nombre) {
    return query(
      `${SELECT_CON_CONTEO}
        WHERE LOWER(r.nombre_rol) LIKE LOWER(?)
        GROUP BY r.id, r.nombre_rol
        ORDER BY r.id`,
      [`%${nombre}%`]
    );
  }
  return query(`${SELECT_CON_CONTEO} GROUP BY r.id, r.nombre_rol ORDER BY r.id`);
}

export async function buscarPorIdConConteo(id) {
  const rows = await query(
    `${SELECT_CON_CONTEO} WHERE r.id = ? GROUP BY r.id, r.nombre_rol LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** ¿Existe otro rol con ese nombre? (opcionalmente excluyendo un id) */
export async function existeNombre(nombre, excluirId = null) {
  const rows = excluirId
    ? await query('SELECT id FROM rol WHERE LOWER(nombre_rol) = LOWER(?) AND id <> ? LIMIT 1', [
        nombre,
        excluirId,
      ])
    : await query('SELECT id FROM rol WHERE LOWER(nombre_rol) = LOWER(?) LIMIT 1', [nombre]);
  return rows.length > 0;
}

export async function crear(nombre) {
  const resultado = await query('INSERT INTO rol (nombre_rol) VALUES (?)', [nombre]);
  return resultado.insertId;
}

export async function actualizar(id, nombre) {
  await query('UPDATE rol SET nombre_rol = ? WHERE id = ?', [nombre, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM rol WHERE id = ?', [id]);
}

/** Cuenta los usuarios asignados a un rol. */
export async function contarUsuarios(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM usuario WHERE id_rol = ?', [id]);
  return rows[0]?.total ?? 0;
}
