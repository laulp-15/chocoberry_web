// src/routes/presentacion.routes.js
// Todas las rutas exigen sesión. OJO: no existe un módulo "Presentaciones" en la
// tabla `modulo`, así que se reutilizan los permisos de "Productos" (las
// presentaciones hacen parte del catálogo de productos).
import { Router } from 'express';
import * as presentacionController from '../controllers/presentacion.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { estadoSchema, idParamSchema } from '../validators/common.validator.js';
import {
  actualizarPresentacionSchema,
  crearPresentacionSchema,
  filtrosPresentacionSchema,
} from '../validators/presentacion.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Productos', 'Ver'),
  validar(filtrosPresentacionSchema, 'query'),
  presentacionController.listar
);

router.get(
  '/:id',
  checkPermiso('Productos', 'Ver'),
  validar(idParamSchema, 'params'),
  presentacionController.obtener
);

router.post(
  '/',
  checkPermiso('Productos', 'Crear'),
  validar(crearPresentacionSchema),
  presentacionController.crear
);

router.put(
  '/:id',
  checkPermiso('Productos', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarPresentacionSchema),
  presentacionController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Productos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  presentacionController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Productos', 'Eliminar'),
  validar(idParamSchema, 'params'),
  presentacionController.eliminar
);

export default router;
