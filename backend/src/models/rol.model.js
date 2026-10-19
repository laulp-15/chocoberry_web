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
