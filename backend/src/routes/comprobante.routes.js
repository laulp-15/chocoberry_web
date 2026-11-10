// src/routes/comprobante.routes.js
// Acciones sobre comprobantes existentes. La subida de uno nuevo vive en
// /pedidos/:id/comprobantes (pedido.routes.js).
import { Router } from 'express';
import * as comprobanteController from '../controllers/comprobante.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  aprobarComprobanteSchema,
  rechazarComprobanteSchema,
} from '../validators/comprobante.validator.js';

const router = Router();

router.use(verifyToken);

// El cliente dueño solo puede eliminar comprobantes Pendientes. Se usa "Ver"
// porque el rol Cliente no debe recibir "Editar Pedidos" (el PUT del pedido no
// valida propiedad).
router.delete(
  '/:id',
  checkPermiso('Pedidos', 'Ver'),
  validar(idParamSchema, 'params'),
  comprobanteController.eliminar
);

router.patch(
  '/:id/aprobar',
  checkPermiso('Pedidos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(aprobarComprobanteSchema),
  comprobanteController.aprobar
);

router.patch(
  '/:id/rechazar',
  checkPermiso('Pedidos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(rechazarComprobanteSchema),
  comprobanteController.rechazar
);

export default router;
