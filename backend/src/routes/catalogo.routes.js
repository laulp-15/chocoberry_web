// src/routes/catalogo.routes.js
// Rutas PÚBLICAS de solo lectura para la tienda: NO exigen sesión.
// Solo devuelven registros activos (estado = true). El panel de administración
// sigue usando /categorias, /productos, /presentaciones, /municipios y
// /glaseados (con permisos).
import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller.js';
import { validar } from '../middlewares/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import { filtrosProductoSchema } from '../validators/producto.validator.js';

const router = Router();

router.get('/categorias', catalogoController.listarCategorias);

router.get('/presentaciones', catalogoController.listarPresentaciones);

router.get(
  '/productos',
  validar(filtrosProductoSchema, 'query'),
  catalogoController.listarProductos
);

router.get('/productos/:id', validar(idParamSchema, 'params'), catalogoController.obtenerProducto);

// Datos maestros de apoyo al checkout (municipios y colores de glaseado).
router.get('/municipios', catalogoController.listarMunicipios);

router.get('/glaseados', catalogoController.listarGlaseados);

export default router;
