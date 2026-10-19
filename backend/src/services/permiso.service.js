// src/services/permiso.service.js
// Reglas de negocio del módulo de permisos.
import { BadRequestError, ConflictError, NotFoundError } from '../errors/index.js';
import * as accionModel from '../models/accion.model.js';
import * as moduloModel from '../models/modulo.model.js';
import * as permisoModel from '../models/permiso.model.js';
import * as rolPermisoModel from '../models/rolPermiso.model.js';
import { serializarPermiso } from '../utils/serializers.js';

/**
 * Regla de negocio: no se puede modificar ni eliminar un permiso que esté
 * asignado a un rol con usuarios. Si el rol no tiene usuarios, sí se permite.
 */
async function asegurarPermisoNoEnUso(idPermiso) {
  const roles = await rolPermisoModel.rolesConUsuariosPorPermiso(idPermiso);
  const enUso = roles.filter((rol) => Number(rol.total_usuarios) > 0);

  if (enUso.length > 0) {
    throw new ConflictError(
      `No se puede modificar ni eliminar el permiso: está asignado al rol "${enUso[0].nombre_rol}", ` +
        'que tiene usuarios asignados.'
    );
  }
}

export async function listar(filtros = {}) {
  const filas = await permisoModel.listar({ modulo: filtros.modulo, accion: filtros.accion });
  return filas.map(serializarPermiso);
}

export async function obtener(id) {
  const permiso = await permisoModel.buscarPorId(id);
  if (!permiso) throw new NotFoundError('Permiso no encontrado.');
  return serializarPermiso(permiso);
}

export async function crear({ id_modulo, id_accion, nombre }) {
  const modulo = await moduloModel.buscarPorId(id_modulo);
  if (!modulo) throw new BadRequestError('El módulo indicado no existe.');

  const accion = await accionModel.buscarPorId(id_accion);
  if (!accion) throw new BadRequestError('La acción indicada no existe.');

  const existente = await permisoModel.buscarPorModuloAccion(id_modulo, id_accion);
  if (existente) {
    throw new ConflictError('Ya existe un permiso para esa combinación de módulo y acción.');
  }

  // Nombre por defecto: "<Acción> <Módulo>" (ej. "Ver Usuarios").
  const nombreFinal = nombre?.trim() || `${accion.nombre} ${modulo.nombre}`;
  if (await permisoModel.existeNombre(nombreFinal)) {
    throw new ConflictError('Ya existe un permiso con ese nombre.');
  }

  const id = await permisoModel.crear({ nombre: nombreFinal, id_modulo, id_accion });
  permisoModel.invalidarCachePermisos();
  return obtener(id);
}

export async function actualizar(id, datos) {
  const permiso = await permisoModel.buscarPorId(id);
  if (!permiso) throw new NotFoundError('Permiso no encontrado.');

  await asegurarPermisoNoEnUso(id);

  const campos = {};

  if (datos.id_modulo !== undefined) {
    const modulo = await moduloModel.buscarPorId(datos.id_modulo);
    if (!modulo) throw new BadRequestError('El módulo indicado no existe.');
    campos.id_modulo = datos.id_modulo;
  }

  if (datos.id_accion !== undefined) {
    const accion = await accionModel.buscarPorId(datos.id_accion);
    if (!accion) throw new BadRequestError('La acción indicada no existe.');
    campos.id_accion = datos.id_accion;
  }

  // Si cambia la combinación módulo+acción, no debe chocar con otro permiso.
  const idModulo = campos.id_modulo ?? permiso.id_modulo;
  const idAccion = campos.id_accion ?? permiso.id_accion;
  if (idModulo !== permiso.id_modulo || idAccion !== permiso.id_accion) {
    const existente = await permisoModel.buscarPorModuloAccion(idModulo, idAccion);
    if (existente && existente.id !== permiso.id) {
      throw new ConflictError('Ya existe un permiso para esa combinación de módulo y acción.');
    }
  }

  if (datos.nombre !== undefined) {
    const nombreLimpio = datos.nombre.trim();
    if (await permisoModel.existeNombre(nombreLimpio, id)) {
      throw new ConflictError('Ya existe otro permiso con ese nombre.');
    }
    campos.nombre = nombreLimpio;
  }

  const actualizado = await permisoModel.actualizar(id, campos);
  permisoModel.invalidarCachePermisos();
  return serializarPermiso(actualizado);
}

export async function eliminar(id) {
  const permiso = await permisoModel.buscarPorId(id);
  if (!permiso) throw new NotFoundError('Permiso no encontrado.');

  await asegurarPermisoNoEnUso(id);

  await permisoModel.eliminar(id);
  permisoModel.invalidarCachePermisos();
}
