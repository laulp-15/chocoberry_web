// src/middlewares/checkPermiso.js
// Autorización por rol/módulo/acción: comprueba que el rol del usuario tenga
// el permiso (módulo + acción) en la tabla rolPermiso.
import { ForbiddenError } from '../errors/index.js';
import * as permisoModel from '../models/permiso.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @param {string} modulo Nombre del módulo tal como está en la BD (ej. "Usuarios").
 * @param {string} accion Nombre de la acción tal como está en la BD (ej. "Ver").
 */
export function checkPermiso(modulo, accion) {
  return asyncHandler(async (req, res, next) => {
    if (!req.usuario) {
      throw new ForbiddenError('No se pudo determinar el usuario de la sesión.');
    }

    const autorizado = await permisoModel.tienePermiso(
      req.usuario.id_rol,
      modulo,
      accion
    );

    if (!autorizado) {
      throw new ForbiddenError(`No tienes permiso para ${accion.toLowerCase()} en el módulo ${modulo}.`);
    }

    next();
  });
}

export default checkPermiso;
