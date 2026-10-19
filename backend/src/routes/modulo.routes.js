// src/routes/modulo.routes.js
// Catálogo de módulos; se administra desde el módulo de permisos "Roles".
import { Router } from 'express';
import * as moduloController from '../controllers/modulo.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  actualizarModuloSchema,
  crearModuloSchema,
  filtrosModuloSchema,
} from '../validators/modulo.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermiso('Roles', 'Ver'), validar(filtrosModuloSchema, 'query'), moduloController.listar);

router.get('/:id', checkPermiso('Roles', 'Ver'), validar(idParamSchema, 'params'), moduloController.obtener);

router.post('/', checkPermiso('Roles', 'Crear'), validar(crearModuloSchema), moduloController.crear);

router.put(
  '/:id',
  checkPermiso('Roles', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarModuloSchema),
  moduloController.actualizar
);

router.delete(
  '/:id',
  checkPermiso('Roles', 'Eliminar'),
  validar(idParamSchema, 'params'),
  moduloController.eliminar
);

export default router;
