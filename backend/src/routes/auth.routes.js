// src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import {
  actualizarPerfilSchema,
  cambioContrasenaSchema,
  loginSchema,
  recuperacionSchema,
  registroSchema,
  restablecerSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Rutas públicas
router.post('/register', validar(registroSchema), authController.registrar);
router.post('/login', validar(loginSchema), authController.login);
router.post('/forgot-password', validar(recuperacionSchema), authController.solicitarRecuperacion);
router.post('/reset-password', validar(restablecerSchema), authController.restablecerContrasena);

// Rutas protegidas (requieren sesión)
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.perfil);
router.put('/me', verifyToken, validar(actualizarPerfilSchema), authController.actualizarPerfil);
router.put('/me/password', verifyToken, validar(cambioContrasenaSchema), authController.cambiarContrasena);

export default router;
