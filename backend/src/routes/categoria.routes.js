// src/routes/categoria.routes.js
// Todas las rutas exigen sesión y el permiso correspondiente del módulo "Categorías".
import { Router } from 'express';
import * as categoriaController from '../controllers/categoria.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import {
  actualizarCategoriaSchema,
  crearCategoriaSchema,
  filtrosCategoriaSchema,
} from '../validators/categoria.validator.js';
import { estadoSchema, idParamSchema } from '../validators/common.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Categorías', 'Ver'),
  validar(filtrosCategoriaSchema, 'query'),
  categoriaController.listar
);

router.get(
  '/:id',
  checkPermiso('Categorías', 'Ver'),
  validar(idParamSchema, 'params'),
  categoriaController.obtener
);

router.post(
  '/',
  checkPermiso('Categorías', 'Crear'),
  validar(crearCategoriaSchema),
  categoriaController.crear
);

router.put(
  '/:id',
  checkPermiso('Categorías', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarCategoriaSchema),
  categoriaController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Categorías', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  categoriaController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Categorías', 'Eliminar'),
  validar(idParamSchema, 'params'),
  categoriaController.eliminar
);

export default router;
