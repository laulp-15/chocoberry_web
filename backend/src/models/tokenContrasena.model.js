// src/models/tokenContrasena.model.js
// Acceso a los tokens de un solo uso para recuperación y activación.
import { query } from '../config/db.js';

async function ejecutar(conexion, sql, params) {
  if (conexion) {
    const [rows] = await conexion.execute(sql, params);
    return rows;
  }
  return query(sql, params);
}

/** Marca como usados los tokens vigentes del mismo usuario y tipo. */
export async function invalidarVigentes(idUsuario, tipo, conexion = null) {
  return ejecutar(
    conexion,
    'UPDATE tokenContrasena SET usado = TRUE WHERE id_usuario = ? AND tipo = ? AND usado = FALSE',
    [idUsuario, tipo]
  );
}

export async function crear({ idUsuario, tokenHash, tipo, fechaExpiracion }, conexion = null) {
  const resultado = await ejecutar(
    conexion,
    'INSERT INTO tokenContrasena (id_usuario, token_hash, tipo, fecha_expiracion) VALUES (?, ?, ?, ?)',
    [idUsuario, tokenHash, tipo, fechaExpiracion]
  );
  return resultado.insertId;
}

/** Busca un token por hash y lo bloquea dentro de la transacción. */
export async function buscarVigentePorHash(tokenHash, conexion = null) {
  const filas = await ejecutar(
    conexion,
    `SELECT id, id_usuario, tipo, fecha_expiracion, usado
       FROM tokenContrasena
      WHERE token_hash = ?
        AND usado = FALSE
        AND fecha_expiracion > NOW()
      LIMIT 1
      ${conexion ? 'FOR UPDATE' : ''}`,
    [tokenHash]
  );
  return filas[0] ?? null;
}

/** Consume el token de forma atómica. Devuelve true si lo marcó como usado. */
export async function marcarUsado(id, conexion = null) {
  const resultado = await ejecutar(
    conexion,
    'UPDATE tokenContrasena SET usado = TRUE WHERE id = ? AND usado = FALSE',
    [id]
  );
  return resultado.affectedRows === 1;
}
