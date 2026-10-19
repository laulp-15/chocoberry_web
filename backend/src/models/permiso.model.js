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

/** Invalida la caché de un rol, o toda la caché si no se indica un rol. */
export function invalidarCachePermisos(idRol) {
  if (idRol === undefined) cache.clear();
  else cache.delete(Number(idRol));
}
