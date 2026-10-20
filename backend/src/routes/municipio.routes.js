// src/routes/municipio.routes.js
// CRUD de municipios (panel). No existe un módulo "Municipios" en la tabla
// `modulo`, así que se reutilizan los permisos de "Productos", igual que
// Presentaciones. La tienda lee los activos desde /catalogo/municipios.
import { Router } from 'express';
import * as municipioController from '../controllers/municipio.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { estadoSchema, idParamSchema } from '../validators/common.validator.js';
import {
  actualizarMunicipioSchema,
  crearMunicipioSchema,
  filtrosMunicipioSchema,
} from '../validators/municipio.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Productos', 'Ver'),
  validar(filtrosMunicipioSchema, 'query'),
  municipioController.listar
);

router.get(
  '/:id',
  checkPermiso('Productos', 'Ver'),
  validar(idParamSchema, 'params'),
  municipioController.obtener
);

router.post(
  '/',
  checkPermiso('Productos', 'Crear'),
  validar(crearMunicipioSchema),
  municipioController.crear
);

router.put(
  '/:id',
  checkPermiso('Productos', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarMunicipioSchema),
  municipioController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Productos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  municipioController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Productos', 'Eliminar'),
  validar(idParamSchema, 'params'),
  municipioController.eliminar
);

export default router;
