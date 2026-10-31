// src/middlewares/rateLimit.js
// Límite para los endpoints públicos de recuperación/activación de contraseña.
import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const VENTANA_MS = 15 * 60 * 1000;
const MAX_SOLICITUDES = env.nodeEnv === 'test' ? 1000 : 5;

export const passwordResetLimiter = rateLimit({
  windowMs: VENTANA_MS,
  limit: MAX_SOLICITUDES,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
  },
});

export default passwordResetLimiter;
