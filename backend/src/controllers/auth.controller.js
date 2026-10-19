// src/controllers/auth.controller.js
// Manejo de request/response del módulo de acceso. Delega la lógica al service.
import * as authService from '../services/auth.service.js';
import * as usuarioService from '../services/usuario.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const registrar = asyncHandler(async (req, res) => {
  const usuario = await authService.registrarCliente(req.validado.body);
  return sendCreated(res, usuario, 'Cuenta creada exitosamente.');
});

export const login = asyncHandler(async (req, res) => {
  const { correo, contrasena } = req.validado.body;
  const resultado = await authService.iniciarSesion({
    correo,
    contrasena,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  return sendSuccess(res, resultado, 'Inicio de sesión exitoso.');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.cerrarSesion(req.usuario);
  return sendSuccess(res, null, 'Sesión cerrada exitosamente.');
});

export const solicitarRecuperacion = asyncHandler(async (req, res) => {
  const data = await authService.solicitarRecuperacion(req.validado.body.correo);
  return sendSuccess(res, data, data.mensaje);
});

export const restablecerContrasena = asyncHandler(async (req, res) => {
  const data = await authService.restablecerContrasena(req.validado.body);
  return sendSuccess(res, data, data.mensaje);
});

export const perfil = asyncHandler(async (req, res) => {
  const usuario = await authService.obtenerPerfil(req.usuario.id);
  return sendSuccess(res, usuario, 'Perfil obtenido exitosamente.');
});

export const actualizarPerfil = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.actualizarPerfil(req.usuario.id, req.validado.body);
  return sendSuccess(res, usuario, 'Perfil actualizado exitosamente.');
});

export const cambiarContrasena = asyncHandler(async (req, res) => {
  const data = await authService.cambiarContrasena(req.usuario.id, req.validado.body);
  return sendSuccess(res, null, data.mensaje);
});
