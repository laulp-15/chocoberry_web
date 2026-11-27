// src/routes/capacidad.routes.js
// Panel de capacidad diaria. Consultar exige "Ver Capacidad" y cualquier
// modificación exige "Editar Capacidad".
import { Router } from 'express';
import * as capacidadController from '../controllers/capacidad.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import {
  fechaCapacidadSchema,
  filtrosCapacidadSchema,
  topeDiaSchema,
  topeEstandarSchema,
} from '../validators/capacidad.validator.js';

const router = Router();

router.use(verifyToken);

// "estandar" va antes de "/:fecha" para que no se interprete como una fecha.
router.get(
  '/estandar',
  checkPermiso('Capacidad', 'Ver'),
  capacidadController.obtenerEstandar
);

router.put(
  '/estandar',
  checkPermiso('Capacidad', 'Editar'),
  validar(topeEstandarSchema),
  capacidadController.actualizarEstandar
);

router.get(
  '/',
  checkPermiso('Capacidad', 'Ver'),
  validar(filtrosCapacidadSchema, 'query'),
  capacidadController.listarMes
);

router.put(
  '/:fecha/bloqueo',
  checkPermiso('Capacidad', 'Editar'),
  validar(fechaCapacidadSchema, 'params'),
  capacidadController.bloquearDia
);

router.put(
  '/:fecha',
  checkPermiso('Capacidad', 'Editar'),
  validar(fechaCapacidadSchema, 'params'),
  validar(topeDiaSchema),
  capacidadController.actualizarDia
);

router.delete(
  '/:fecha',
  checkPermiso('Capacidad', 'Editar'),
  validar(fechaCapacidadSchema, 'params'),
  capacidadController.restablecerDia
);

router.get(
  '/:fecha',
  checkPermiso('Capacidad', 'Ver'),
  validar(fechaCapacidadSchema, 'params'),
  capacidadController.obtenerDia
);

export default router;
