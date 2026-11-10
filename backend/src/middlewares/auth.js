// src/middlewares/auth.js
// Verifica el JWT (Authorization: Bearer <token>) y deja el usuario en req.usuario.
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';
import * as usuarioModel from '../models/usuario.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyToken = asyncHandler(async (req, res, next) => {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    throw new UnauthorizedError('Token de acceso no proporcionado.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new UnauthorizedError('Token inválido o expirado.');
  }

  // Se relee el usuario desde la BD para reflejar cambios de estado o de rol.
  const usuario = await usuarioModel.buscarPorId(payload.sub);
  if (!usuario) throw new UnauthorizedError('El usuario del token ya no existe.');
  if (!usuario.estado) throw new ForbiddenError('La cuenta está deshabilitada.');

  req.usuario = usuario;
  next();
});

/**
 * Restringe una ruta a uno o varios roles por nombre (ej. "Repartidor").
 * Debe usarse después de verifyToken.
 */
export function checkRol(...roles) {
  const permitidos = roles.map((rol) => String(rol).trim().toLowerCase());

  return (req, res, next) => {
    const actual = String(req.usuario?.nombre_rol ?? '').trim().toLowerCase();
    if (!permitidos.includes(actual)) {
      return next(new ForbiddenError('No tienes permiso para realizar esta acción.'));
    }
    return next();
  };
}

export default verifyToken;
