// src/routes/colorGlaseado.routes.js
// CRUD de glaseados (panel). No existe un módulo "Glaseados" en la tabla
// `modulo`, así que se reutilizan los permisos de "Productos", igual que
// Presentaciones. La tienda lee los activos desde /catalogo/glaseados.
import { Router } from 'express';
import * as colorGlaseadoController from '../controllers/colorGlaseado.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { estadoSchema, idParamSchema } from '../validators/common.validator.js';
import {
  actualizarColorGlaseadoSchema,
  crearColorGlaseadoSchema,
  filtrosColorGlaseadoSchema,
} from '../validators/colorGlaseado.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Productos', 'Ver'),
  validar(filtrosColorGlaseadoSchema, 'query'),
  colorGlaseadoController.listar
);

router.get(
  '/:id',
  checkPermiso('Productos', 'Ver'),
  validar(idParamSchema, 'params'),
  colorGlaseadoController.obtener
);

router.post(
  '/',
  checkPermiso('Productos', 'Crear'),
  validar(crearColorGlaseadoSchema),
  colorGlaseadoController.crear
);

router.put(
  '/:id',
  checkPermiso('Productos', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarColorGlaseadoSchema),
  colorGlaseadoController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Productos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  colorGlaseadoController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Productos', 'Eliminar'),
  validar(idParamSchema, 'params'),
  colorGlaseadoController.eliminar
);

export default router;
