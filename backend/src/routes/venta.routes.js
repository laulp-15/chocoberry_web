// src/routes/venta.routes.js
// Ventas es una vista de solo lectura de los pedidos confirmados. No se crean,
// editan ni eliminan ventas desde este módulo: el ciclo de vida vive en Pedidos.
import { Router } from 'express';
import * as ventaController from '../controllers/venta.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import { filtrosVentaSchema } from '../validators/venta.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Ventas', 'Ver'),
  validar(filtrosVentaSchema, 'query'),
  ventaController.listar
);

router.get(
  '/:id',
  checkPermiso('Ventas', 'Ver'),
  validar(idParamSchema, 'params'),
  ventaController.obtener
);

export default router;
