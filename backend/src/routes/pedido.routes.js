// src/routes/pedido.routes.js
// Todas las rutas exigen sesión y el permiso del módulo "Pedidos".
// El alcance por rol (cliente = solo lo suyo, repartidor = sin cambiar
// estado) se aplica en el service.
import { Router } from 'express';
import * as pedidoController from '../controllers/pedido.controller.js';
import { checkRol, verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { subirComprobante, subirEvidencia } from '../middlewares/upload.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  actualizarPedidoSchema,
  cambiarEstadoPedidoSchema,
  crearPedidoSchema,
  filtrosPedidoSchema,
  rechazarPedidoSchema,
  registrarEntregaSchema,
} from '../validators/pedido.validator.js';

const router = Router();

router.use(verifyToken);

// "Mis pedidos" va antes de /:id para que "mios" no se interprete como un id.
router.get(
  '/mios',
  checkPermiso('Pedidos', 'Ver'),
  validar(filtrosPedidoSchema, 'query'),
  pedidoController.listarMios
);

router.get(
  '/mios/:id',
  checkPermiso('Pedidos', 'Ver'),
  validar(idParamSchema, 'params'),
  pedidoController.obtenerMio
);

router.get(
  '/',
  checkPermiso('Pedidos', 'Ver'),
  validar(filtrosPedidoSchema, 'query'),
  pedidoController.listar
);

router.get(
  '/:id',
  checkPermiso('Pedidos', 'Ver'),
  validar(idParamSchema, 'params'),
  pedidoController.obtener
);

// El comprobante (multipart) va antes de validar para que el cuerpo ya esté
// disponible en req.validado.body (incluidas las líneas como texto JSON).
router.post(
  '/',
  checkPermiso('Pedidos', 'Crear'),
  subirComprobante,
  validar(crearPedidoSchema),
  pedidoController.crear
);

router.put(
  '/:id',
  checkPermiso('Pedidos', 'Editar'),
  validar(idParamSchema, 'params'),
  validar(actualizarPedidoSchema),
  pedidoController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Pedidos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(cambiarEstadoPedidoSchema),
  pedidoController.cambiarEstado
);

router.patch(
  '/:id/rechazar',
  checkPermiso('Pedidos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(rechazarPedidoSchema),
  pedidoController.rechazar
);

router.patch(
  '/:id/entrega',
  checkPermiso('Pedidos', 'Editar'),
  checkRol('Repartidor'),
  subirEvidencia,
  validar(idParamSchema, 'params'),
  validar(registrarEntregaSchema),
  pedidoController.registrarEntrega
);

router.delete(
  '/:id',
  checkPermiso('Pedidos', 'Eliminar'),
  validar(idParamSchema, 'params'),
  pedidoController.eliminar
);

export default router;
