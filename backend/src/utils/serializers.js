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

/** Convierte una fila de `rol` (con conteos) al objeto público. */
export function serializarRol(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre_rol,
    permisos: Number(row.total_permisos ?? 0),
    usuarios: Number(row.total_usuarios ?? 0),
  };
}

export function serializarModulo(row) {
  if (!row) return null;
  return { id: row.id, nombre: row.nombre };
}

export function serializarAccion(row) {
  if (!row) return null;
  return { id: row.id, nombre: row.nombre };
}

/** Convierte una fila de `permiso` (con módulo y acción) al objeto público. */
export function serializarPermiso(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    modulo: row.modulo ? { id: row.id_modulo, nombre: row.modulo } : { id: row.id_modulo },
    accion: row.accion ? { id: row.id_accion, nombre: row.accion } : { id: row.id_accion },
  };
}

/** Convierte una fila de `categoria` al objeto público. */
export function serializarCategoria(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    estado: Boolean(row.estado),
  };
}

/** Convierte una fila de `producto` (con nombre_categoria) al objeto público. */
export function serializarProducto(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    imagen: row.imagen,
    estado: Boolean(row.estado),
    categoria: row.categoria
      ? { id: row.id_categoria, nombre: row.categoria }
      : { id: row.id_categoria },
  };
}

/** Convierte una fila de `presentacion` al objeto público. */
export function serializarPresentacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    cantidadFresas: row.cantidad_fresas,
    // DECIMAL llega como texto desde MySQL; se normaliza a número.
    precio: Number(row.precio),
    estado: Boolean(row.estado),
  };
}
