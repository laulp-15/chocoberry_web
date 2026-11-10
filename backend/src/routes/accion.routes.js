// src/routes/accion.routes.js
// Catálogo de acciones; se administra desde el módulo de permisos "Roles".
import { Router } from 'express';
import * as accionController from '../controllers/accion.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  actualizarAccionSchema,
  crearAccionSchema,
  filtrosAccionSchema,
} from '../validators/accion.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermiso('Roles', 'Ver'), validar(filtrosAccionSchema, 'query'), accionController.listar);

router.get('/:id', checkPermiso('Roles', 'Ver'), validar(idParamSchema, 'params'), accionController.obtener);

router.post('/', checkPermiso('Roles', 'Crear'), validar(crearAccionSchema), accionController.crear);

router.put(
  '/:id',
  checkPermiso('Roles', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarAccionSchema),
  accionController.actualizar
);

router.delete(
  '/:id',
  checkPermiso('Roles', 'Eliminar'),
  validar(idParamSchema, 'params'),
  accionController.eliminar
);

export default router;
