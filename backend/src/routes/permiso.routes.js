// src/routes/permiso.routes.js
// Catálogo de permisos; se administra desde el módulo de permisos "Roles".
import { Router } from 'express';
import * as permisoController from '../controllers/permiso.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  actualizarPermisoSchema,
  crearPermisoSchema,
  filtrosPermisoSchema,
} from '../validators/permiso.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermiso('Roles', 'Ver'), validar(filtrosPermisoSchema, 'query'), permisoController.listar);

router.get('/:id', checkPermiso('Roles', 'Ver'), validar(idParamSchema, 'params'), permisoController.obtener);

router.post('/', checkPermiso('Roles', 'Crear'), validar(crearPermisoSchema), permisoController.crear);

router.put(
  '/:id',
  checkPermiso('Roles', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarPermisoSchema),
  permisoController.actualizar
);

router.delete(
  '/:id',
  checkPermiso('Roles', 'Eliminar'),
  validar(idParamSchema, 'params'),
  permisoController.eliminar
);

export default router;
