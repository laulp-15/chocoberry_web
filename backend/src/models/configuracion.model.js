// src/models/configuracion.model.js
// Acceso a la tabla clave/valor `configuracion`. Se usa, entre otras cosas,
// para guardar el tope estándar de fresas por día.
import { query } from '../config/db.js';

async function ejecutar(sql, params = [], conexion = null) {
  if (conexion) {
    const [filas] = await conexion.execute(sql, params);
    return filas;
  }
  return query(sql, params);
}

export async function obtener(clave, conexion = null) {
  const filas = await ejecutar(
    'SELECT clave, valor FROM configuracion WHERE clave = ? LIMIT 1',
    [clave],
    conexion
  );
  return filas[0] ?? null;
}

/** Lee la fila bloqueándola para serializar operaciones de capacidad. */
export async function obtenerParaActualizar(clave, conexion) {
  const filas = await ejecutar(
    'SELECT clave, valor FROM configuracion WHERE clave = ? FOR UPDATE',
    [clave],
    conexion
  );
  return filas[0] ?? null;
}

export async function guardar(clave, valor, conexion = null) {
  await ejecutar(
    `INSERT INTO configuracion (clave, valor)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [clave, String(valor)],
    conexion
  );
  return obtener(clave, conexion);
}
