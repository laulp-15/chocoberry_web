// src/routes/usuario.routes.js
// Todas las rutas exigen sesión y el permiso correspondiente del módulo "Usuarios".
import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  estadoSchema,
  filtrosUsuarioSchema,
  idParamSchema,
} from '../validators/usuario.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermiso('Usuarios', 'Ver'), validar(filtrosUsuarioSchema, 'query'), usuarioController.listar);

router.get('/:id', checkPermiso('Usuarios', 'Ver'), validar(idParamSchema, 'params'), usuarioController.obtener);

router.post('/', checkPermiso('Usuarios', 'Crear'), validar(crearUsuarioSchema), usuarioController.crear);

router.put(
  '/:id',
  checkPermiso('Usuarios', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarUsuarioSchema),
  usuarioController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Usuarios', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  usuarioController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Usuarios', 'Eliminar'),
  validar(idParamSchema, 'params'),
  usuarioController.eliminar
);

export default router;
