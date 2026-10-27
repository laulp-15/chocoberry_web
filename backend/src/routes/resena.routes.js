// src/routes/resena.routes.js
// Panel de reseñas (requiere permisos de moderación) y creación de reseñas
// para usuarios autenticados. La lectura pública está en /api/catalogo/resenas.
import { Router } from 'express';
import * as resenaController from '../controllers/resena.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  cambiarEstadoResenaSchema,
  crearResenaSchema,
  filtrosResenaSchema,
} from '../validators/resena.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Reseñas', 'Ver'),
  checkPermiso('Reseñas', 'Cambiar estado'),
  validar(filtrosResenaSchema, 'query'),
  resenaController.listar
);

router.get(
  '/:id',
  checkPermiso('Reseñas', 'Ver'),
  checkPermiso('Reseñas', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  resenaController.obtener
);

// Clientes y administradores pueden publicar. El repartidor no tiene el
// permiso "Crear Reseñas" en los datos iniciales.
router.post(
  '/',
  checkPermiso('Reseñas', 'Crear'),
  validar(crearResenaSchema),
  resenaController.crear
);

router.patch(
  '/:id/estado',
  checkPermiso('Reseñas', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(cambiarEstadoResenaSchema),
  resenaController.cambiarEstado
);

export default router;
