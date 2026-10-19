// src/controllers/usuario.controller.js
// Manejo de request/response del módulo de usuarios.
import * as usuarioService from '../services/usuario.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const usuarios = await usuarioService.listar(req.validado.query);
  return sendSuccess(res, usuarios, 'Usuarios obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.obtener(req.validado.params.id);
  return sendSuccess(res, usuario, 'Usuario obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.crear(req.validado.body);
  return sendCreated(res, usuario, 'Usuario creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, usuario, 'Usuario actualizado exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(
    res,
    usuario,
    `Usuario ${usuario.estado ? 'activado' : 'desactivado'} exitosamente.`
  );
});

export const eliminar = asyncHandler(async (req, res) => {
  await usuarioService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Usuario eliminado exitosamente.');
});
