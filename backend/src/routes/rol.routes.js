// src/routes/rol.routes.js
// Todas las rutas exigen sesión y el permiso correspondiente del módulo "Roles".
import { Router } from 'express';
import * as rolController from '../controllers/rol.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  actualizarRolSchema,
  asignarPermisosSchema,
  crearRolSchema,
  filtrosRolSchema,
} from '../validators/rol.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermiso('Roles', 'Ver'), validar(filtrosRolSchema, 'query'), rolController.listar);

// Catálogo para el selector del formulario de usuarios. No exige "Roles Ver"
// para que un gestor de usuarios pueda asignar roles sin administrarlos.
router.get(
  '/opciones',
  checkPermiso('Usuarios', 'Ver'),
  rolController.opciones
);

router.get('/:id', checkPermiso('Roles', 'Ver'), validar(idParamSchema, 'params'), rolController.obtener);

router.post('/', checkPermiso('Roles', 'Crear'), validar(crearRolSchema), rolController.crear);

router.put(
  '/:id',
  checkPermiso('Roles', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarRolSchema),
  rolController.actualizar
);

router.delete(
  '/:id',
  checkPermiso('Roles', 'Eliminar'),
  validar(idParamSchema, 'params'),
  rolController.eliminar
);

router.get(
  '/:id/permisos',
  checkPermiso('Roles', 'Ver'),
  validar(idParamSchema, 'params'),
  rolController.obtenerPermisos
);

router.put(
  '/:id/permisos',
  checkPermiso('Roles', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(asignarPermisosSchema),
  rolController.asignarPermisos
);

export default router;
