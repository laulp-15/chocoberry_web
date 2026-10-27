// src/models/resena.model.js
// Acceso a la tabla `resena`. La reseña es general (no está asociada a un
// producto ni a un pedido) y pertenece al usuario que la publicó.
import { query } from '../config/db.js';

const SELECT_BASE = `SELECT r.id, r.calificacion, r.comentario, r.fecha, r.estado,
                            r.id_usuario, u.nombres, u.apellidos
                       FROM resena r
                       JOIN usuario u ON u.id = r.id_usuario`;

/**
 * Lista reseñas con filtros opcionales.
 * `estado` se usa para la vista pública (true) o para el panel (true/false).
 */
export async function listar({ estado, calificacion, cliente } = {}) {
  const where = [];
  const params = [];

  if (estado !== undefined) {
    where.push('r.estado = ?');
    params.push(estado ? 1 : 0);
  }

  if (calificacion) {
    where.push('r.calificacion = ?');
    params.push(calificacion);
  }

  if (cliente) {
    const like = `%${cliente}%`;
    where.push(
      `(u.nombres LIKE ? OR u.apellidos LIKE ?
        OR CONCAT(u.nombres, ' ', u.apellidos) LIKE ?)`
    );
    params.push(like, like, like);
  }

  const sql = `${SELECT_BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
               ORDER BY r.fecha DESC, r.id DESC`;

  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE r.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/**
 * Inserta una reseña. La API no acepta `fecha` ni `estado`: la fecha la define
 * la BD y las reseñas nuevas nacen inactivas. El seed histórico puede enviar
 * ambos valores explícitamente para repartir las reseñas en el tiempo y
 * mantenerlas visibles en la demostración.
 */
export async function crear({
  calificacion,
  comentario,
  id_usuario,
  fecha,
  estado = false,
}) {
  const columnas = ['calificacion', 'comentario', 'id_usuario', 'estado'];
  const valores = [calificacion, comentario, id_usuario, estado ? 1 : 0];

  if (fecha) {
    columnas.splice(2, 0, 'fecha');
    valores.splice(2, 0, fecha);
  }

  const resultado = await query(
    `INSERT INTO resena (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
    valores
  );
  return resultado.insertId;
}

export async function cambiarEstado(id, estado) {
  await query('UPDATE resena SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}
