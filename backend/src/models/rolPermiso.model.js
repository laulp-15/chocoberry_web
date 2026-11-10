// src/models/rolPermiso.model.js
// Acceso a la tabla intermedia `rolPermiso` (permisos asignados a cada rol).
import { query, withTransaction } from '../config/db.js';

/** Ids de los permisos asignados a un rol. */
export async function permisoIdsPorRol(idRol) {
  const rows = await query('SELECT id_permiso FROM rolPermiso WHERE id_rol = ? ORDER BY id_permiso', [
    idRol,
  ]);
  return rows.map((r) => r.id_permiso);
}

/**
 * Reemplaza por completo los permisos de un rol, dentro de una transacción:
 * borra los actuales e inserta los nuevos (o deja el rol sin permisos si la
 * lista viene vacía).
 */
export async function reemplazarPermisos(idRol, idsPermiso) {
  return withTransaction(async (connection) => {
    await connection.execute('DELETE FROM rolPermiso WHERE id_rol = ?', [idRol]);

    if (idsPermiso.length > 0) {
      const valores = idsPermiso.map(() => '(?, ?)').join(', ');
      const params = idsPermiso.flatMap((idPermiso) => [idRol, idPermiso]);
      await connection.execute(
        `INSERT INTO rolPermiso (id_rol, id_permiso) VALUES ${valores}`,
        params
      );
    }
  });
}

/**
 * Roles que tienen asignado un permiso, con el número de usuarios de cada uno.
 * Sirve para aplicar la regla "no modificar/eliminar permisos en uso".
 */
export async function rolesConUsuariosPorPermiso(idPermiso) {
  return query(
    `SELECT r.id, r.nombre_rol, COUNT(u.id) AS total_usuarios
       FROM rolPermiso rp
       JOIN rol r ON r.id = rp.id_rol
       LEFT JOIN usuario u ON u.id_rol = r.id
      WHERE rp.id_permiso = ?
      GROUP BY r.id, r.nombre_rol
      ORDER BY r.id`,
    [idPermiso]
  );
}
