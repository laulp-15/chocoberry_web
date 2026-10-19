// src/services/rol.service.js
// Reglas de negocio del módulo de roles y de la asignación de permisos.
import { BadRequestError, ConflictError, NotFoundError } from '../errors/index.js';
import * as permisoModel from '../models/permiso.model.js';
import * as rolModel from '../models/rol.model.js';
import * as rolPermisoModel from '../models/rolPermiso.model.js';
import { serializarPermiso, serializarRol } from '../utils/serializers.js';

/** Valida y normaliza la lista de ids de permisos a asignar. */
async function validarPermisos(permisos) {
  if (!Array.isArray(permisos) || permisos.length === 0) {
    throw new BadRequestError('Debes asignar al menos un permiso.');
  }

  const ids = [...new Set(permisos.map(Number))];
  const existentes = await permisoModel.buscarPorIds(ids);

  if (existentes.length !== ids.length) {
    throw new BadRequestError('Uno o más permisos indicados no existen.');
  }

  return ids;
}

export async function listar(filtros = {}) {
  const filas = await rolModel.listarConConteo({ nombre: filtros.nombre });
  return filas.map(serializarRol);
}

export async function obtener(id) {
  const rol = await rolModel.buscarPorIdConConteo(id);
  if (!rol) throw new NotFoundError('Rol no encontrado.');
  return serializarRol(rol);
}

export async function crear({ nombre, permisos }) {
  const nombreLimpio = nombre.trim();
  if (await rolModel.existeNombre(nombreLimpio)) {
    throw new ConflictError('Ya existe un rol con ese nombre.');
  }

  const ids = await validarPermisos(permisos);

  const id = await rolModel.crear(nombreLimpio);
  await rolPermisoModel.reemplazarPermisos(id, ids);
  permisoModel.invalidarCachePermisos(id);

  return obtener(id);
}

export async function actualizar(id, { nombre, permisos }) {
  const rol = await rolModel.buscarPorId(id);
  if (!rol) throw new NotFoundError('Rol no encontrado.');

  const nombreLimpio = nombre.trim();
  if (await rolModel.existeNombre(nombreLimpio, id)) {
    throw new ConflictError('Ya existe otro rol con ese nombre.');
  }

  await rolModel.actualizar(id, nombreLimpio);

  // Los permisos son opcionales: si no vienen, se conservan los actuales.
  if (permisos !== undefined) {
    const ids = await validarPermisos(permisos);
    await rolPermisoModel.reemplazarPermisos(id, ids);
    permisoModel.invalidarCachePermisos(id);
  }

  return obtener(id);
}

export async function eliminar(id) {
  const rol = await rolModel.buscarPorId(id);
  if (!rol) throw new NotFoundError('Rol no encontrado.');

  // Regla de negocio: no se elimina un rol en uso (con usuarios asignados).
  const usuarios = await rolModel.contarUsuarios(id);
  if (usuarios > 0) {
    throw new ConflictError(
      `No se puede eliminar el rol "${rol.nombre_rol}": tiene ${usuarios} usuario(s) asignado(s).`
    );
  }

  await rolModel.eliminar(id); // las filas de rolPermiso se borran en cascada
  permisoModel.invalidarCachePermisos(id);
}

/** Permisos asignados a un rol. */
export async function obtenerPermisos(id) {
  const rol = await rolModel.buscarPorId(id);
  if (!rol) throw new NotFoundError('Rol no encontrado.');

  const filas = await permisoModel.listarPorRol(id);
  return filas.map(serializarPermiso);
}

/** Reemplaza por completo los permisos de un rol. */
export async function asignarPermisos(id, { permisos }) {
  const rol = await rolModel.buscarPorId(id);
  if (!rol) throw new NotFoundError('Rol no encontrado.');

  const ids = await validarPermisos(permisos);
  await rolPermisoModel.reemplazarPermisos(id, ids);
  permisoModel.invalidarCachePermisos(id);

  return obtenerPermisos(id);
}
