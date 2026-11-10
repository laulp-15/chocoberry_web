// src/routes/producto.routes.js
// Todas las rutas exigen sesión y el permiso correspondiente del módulo "Productos".
// La subida de imagen (multer) va antes de validar para que el cuerpo multipart
// ya esté disponible en req.validado.
import { Router } from 'express';
import * as productoController from '../controllers/producto.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { subirImagenes } from '../middlewares/upload.js';
import { validar } from '../middlewares/validate.js';
import { estadoSchema, idParamSchema } from '../validators/common.validator.js';
import {
  actualizarProductoSchema,
  crearProductoSchema,
  filtrosProductoSchema,
} from '../validators/producto.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermiso('Productos', 'Ver'),
  validar(filtrosProductoSchema, 'query'),
  productoController.listar
);

router.get(
  '/:id',
  checkPermiso('Productos', 'Ver'),
  validar(idParamSchema, 'params'),
  productoController.obtener
);

router.post(
  '/',
  checkPermiso('Productos', 'Crear'),
  subirImagenes,
  validar(crearProductoSchema),
  productoController.crear
);

router.put(
  '/:id',
  checkPermiso('Productos', 'Editar'),
  subirImagenes,
  validar(idParamSchema, 'params'),
  validar(actualizarProductoSchema),
  productoController.actualizar
);

router.patch(
  '/:id/estado',
  checkPermiso('Productos', 'Cambiar estado'),
  validar(idParamSchema, 'params'),
  validar(estadoSchema),
  productoController.cambiarEstado
);

router.delete(
  '/:id',
  checkPermiso('Productos', 'Eliminar'),
  validar(idParamSchema, 'params'),
  productoController.eliminar
);

export default router;
