// src/services/modulo.service.js
// Reglas de negocio del catálogo de módulos.
import { ConflictError, NotFoundError } from '../errors/index.js';
import * as moduloModel from '../models/modulo.model.js';
import * as permisoModel from '../models/permiso.model.js';
import { serializarModulo } from '../utils/serializers.js';

export async function listar(filtros = {}) {
  const filas = await moduloModel.listar({ nombre: filtros.nombre });
  return filas.map(serializarModulo);
}

export async function obtener(id) {
  const modulo = await moduloModel.buscarPorId(id);
  if (!modulo) throw new NotFoundError('Módulo no encontrado.');
  return serializarModulo(modulo);
}

export async function crear({ nombre }) {
  const nombreLimpio = nombre.trim();
  if (await moduloModel.existeNombre(nombreLimpio)) {
    throw new ConflictError('Ya existe un módulo con ese nombre.');
  }
  const id = await moduloModel.crear(nombreLimpio);
  return obtener(id);
}

export async function actualizar(id, { nombre }) {
  const actual = await moduloModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Módulo no encontrado.');

  const nombreLimpio = nombre.trim();
  if (await moduloModel.existeNombre(nombreLimpio, id)) {
    throw new ConflictError('Ya existe otro módulo con ese nombre.');
  }

  const actualizado = await moduloModel.actualizar(id, nombreLimpio);
  // El nombre del módulo cambia la identidad de los permisos en caché.
  permisoModel.invalidarCachePermisos();
  return serializarModulo(actualizado);
}

export async function eliminar(id) {
  const modulo = await moduloModel.buscarPorId(id);
  if (!modulo) throw new NotFoundError('Módulo no encontrado.');

  const permisos = await moduloModel.contarPermisos(id);
  if (permisos > 0) {
    throw new ConflictError(
      `No se puede eliminar el módulo "${modulo.nombre}": tiene ${permisos} permiso(s) asociado(s).`
    );
  }

  await moduloModel.eliminar(id);
}
