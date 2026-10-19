// src/services/accion.service.js
// Reglas de negocio del catálogo de acciones.
import { ConflictError, NotFoundError } from '../errors/index.js';
import * as accionModel from '../models/accion.model.js';
import * as permisoModel from '../models/permiso.model.js';
import { serializarAccion } from '../utils/serializers.js';

export async function listar(filtros = {}) {
  const filas = await accionModel.listar({ nombre: filtros.nombre });
  return filas.map(serializarAccion);
}

export async function obtener(id) {
  const accion = await accionModel.buscarPorId(id);
  if (!accion) throw new NotFoundError('Acción no encontrada.');
  return serializarAccion(accion);
}

export async function crear({ nombre }) {
  const nombreLimpio = nombre.trim();
  if (await accionModel.existeNombre(nombreLimpio)) {
    throw new ConflictError('Ya existe una acción con ese nombre.');
  }
  const id = await accionModel.crear(nombreLimpio);
  return obtener(id);
}

export async function actualizar(id, { nombre }) {
  const actual = await accionModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Acción no encontrada.');

  const nombreLimpio = nombre.trim();
  if (await accionModel.existeNombre(nombreLimpio, id)) {
    throw new ConflictError('Ya existe otra acción con ese nombre.');
  }

  const actualizada = await accionModel.actualizar(id, nombreLimpio);
  permisoModel.invalidarCachePermisos();
  return serializarAccion(actualizada);
}

export async function eliminar(id) {
  const accion = await accionModel.buscarPorId(id);
  if (!accion) throw new NotFoundError('Acción no encontrada.');

  const permisos = await accionModel.contarPermisos(id);
  if (permisos > 0) {
    throw new ConflictError(
      `No se puede eliminar la acción "${accion.nombre}": tiene ${permisos} permiso(s) asociado(s).`
    );
  }

  await accionModel.eliminar(id);
}
