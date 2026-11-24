// src/models/usuario.model.js
// Acceso a la tabla `usuario`. Los nombres de columnas siguen EXACTAMENTE la
// capitalización del script SQL (importante en Linux).
import { query } from '../config/db.js';

// Columnas que se pueden actualizar (lista blanca para evitar inyección).
const CAMPOS_ACTUALIZABLES = [
  'nombres',
  'apellidos',
  'tipo_documento',
  'numero_documento',
  'correo',
  'contrasena',
  'telefono',
  'direccion',
  'estado',
  'id_rol',
];

const FROM_BASE = `FROM usuario u
                       JOIN rol r ON r.id = u.id_rol`;

const SELECT_BASE = `SELECT u.*, r.nombre_rol
                       ${FROM_BASE}`;

/** Busca por correo (incluye la contraseña hasheada, para el login). */
export async function buscarPorCorreo(correo) {
  const rows = await query(`${SELECT_BASE} WHERE u.correo = ? LIMIT 1`, [correo]);
  return rows[0] ?? null;
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE u.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/**
 * Busca un usuario por número de documento. `excluirId` permite ignorar al
 * propio usuario al validar una edición.
 */
export async function buscarPorNumeroDocumento(numeroDocumento, excluirId = null) {
  const params = [numeroDocumento];
  let sql = `${SELECT_BASE} WHERE u.numero_documento = ?`;

  if (excluirId !== null && excluirId !== undefined) {
    sql += ' AND u.id <> ?';
    params.push(excluirId);
  }

  const rows = await query(`${sql} LIMIT 1`, params);
  return rows[0] ?? null;
}

/** Construye el WHERE compartido por listados y conteos. */
function construirFiltros({ nombre, correo, buscar, rol, idRol, estado } = {}) {
  const where = [];
  const params = [];

  if (nombre) {
    const like = `%${nombre}%`;
    where.push(
      "(u.nombres LIKE ? OR u.apellidos LIKE ? OR CONCAT(u.nombres, ' ', u.apellidos) LIKE ?)"
    );
    params.push(like, like, like);
  }

  if (correo) {
    where.push('u.correo LIKE ?');
    params.push(`%${correo}%`);
  }

  if (buscar) {
    const like = `%${buscar}%`;
    where.push(
      "(u.nombres LIKE ? OR u.apellidos LIKE ? OR CONCAT(u.nombres, ' ', u.apellidos) LIKE ? OR u.correo LIKE ?)"
    );
    params.push(like, like, like, like);
  }

  if (idRol) {
    where.push('u.id_rol = ?');
    params.push(idRol);
  } else if (rol) {
    where.push('LOWER(r.nombre_rol) = LOWER(?)');
    params.push(rol);
  }

  if (estado !== undefined) {
    where.push('u.estado = ?');
    params.push(estado ? 1 : 0);
  }

  return {
    whereSql: where.length ? ` WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

/**
 * Lista usuarios con filtros opcionales. Agrega LIMIT/OFFSET solo cuando se
 * reciben `page` y `limit`.
 */
export async function listar(filtros = {}) {
  const { page, limit, ...resto } = filtros;
  const { whereSql, params } = construirFiltros(resto);
  const paginado = Number.isInteger(page) && Number.isInteger(limit);

  let sql = `${SELECT_BASE}${whereSql} ORDER BY u.id DESC`;
  const paramsSql = [...params];

  if (paginado) {
    sql += ' LIMIT ? OFFSET ?';
    paramsSql.push(limit, (page - 1) * limit);
  }

  return query(sql, paramsSql);
}

/** Cuenta usuarios usando exactamente los mismos filtros del listado. */
export async function contar(filtros = {}) {
  const { page, limit, ...resto } = filtros;
  const { whereSql, params } = construirFiltros(resto);
  const filas = await query(
    `SELECT COUNT(*) AS total ${FROM_BASE}${whereSql}`,
    params
  );
  return Number(filas[0]?.total ?? 0);
}

/** Inserta un usuario y devuelve su id. */
export async function crear(datos) {
  const resultado = await query(
    `INSERT INTO usuario
       (nombres, apellidos, tipo_documento, numero_documento, correo, contrasena,
        telefono, direccion, estado, id_rol)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.nombres,
      datos.apellidos,
      datos.tipo_documento,
      datos.numero_documento,
      datos.correo,
      datos.contrasena,
      datos.telefono ?? null,
      datos.direccion ?? null,
      datos.estado ? 1 : 0,
      datos.id_rol,
    ]
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
  await query(`UPDATE usuario SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/** Cambia el estado (activo/inactivo) de un usuario. */
export async function cambiarEstado(id, estado) {
  await query('UPDATE usuario SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM usuario WHERE id = ?', [id]);
}

/** Cuenta los pedidos asociados a un usuario (para bloquear su eliminación). */
export async function contarPedidos(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM pedido WHERE id_usuario = ?', [id]);
  return rows[0]?.total ?? 0;
}
