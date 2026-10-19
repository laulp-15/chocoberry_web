// src/utils/serializers.js
// Transforman las filas crudas de MySQL (snake_case) a la forma que devuelve
// la API (camelCase). Así la BD queda desacoplada del contrato de la API.
import { slugify } from './text.js';

/** Convierte una fila de `usuario` (con nombre_rol) al objeto público. */
export function serializarUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    nombreCompleto: `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    correo: row.correo,
    telefono: row.telefono,
    barrio: row.barrio,
    direccion: row.direccion,
    fechaRegistro: row.fecha,
    estado: Boolean(row.estado),
    rol: row.nombre_rol
      ? { id: row.id_rol, nombre: row.nombre_rol, slug: slugify(row.nombre_rol) }
      : { id: row.id_rol },
  };
}
